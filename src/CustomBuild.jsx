import { useState, useRef, useEffect } from "react";

// ─── Server-side KV storage helpers ──────────────────────────────────────────
// Replaces window.storage — works on live Vercel deployment via Upstash Redis
async function kvStorageGet(key) {
  try {
    const res = await fetch("/api/storage?key=" + encodeURIComponent(key));
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ? { value: data.value } : null;
  } catch(e) { return null; }
}

async function kvStorageSet(key, value) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", key, value }),
    });
    return res.ok;
  } catch(e) { return false; }
}

async function kvStorageDel(key) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", key }),
    });
    return res.ok;
  } catch(e) { return false; }
}



// ─── Intake Form Modal ────────────────────────────────────────────────────────
const INTAKE_TABS = ["Brand", "Positioning", "Design", "Sitemap", "Copy", "Pricing"];

const DEFAULT_COLORS = [
  { name: "Ink", hex: "", use: "Primary text, dark section backgrounds" },
  { name: "Accent", hex: "", use: "Buttons, accent elements" },
  { name: "Accent Deep", hex: "", use: "Links, hover states" },
  { name: "Background", hex: "", use: "Primary surface, default background" },
  { name: "Dark Panel", hex: "", use: "Dark panels, cards, pricing tiers" },
  { name: "Muted", hex: "", use: "Muted labels, captions" },
  { name: "Warm White", hex: "", use: "Clean surface, text on dark" },
  { name: "Text", hex: "", use: "Body copy on light backgrounds" },
];

const DEFAULT_TIERS = [
  { name: "", subtitle: "", description: "", price: "" },
  { name: "", subtitle: "", description: "", price: "" },
  { name: "", subtitle: "", description: "", price: "" },
];

function IntakeForm({ onClose, onComplete }) {
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
function BriefReview({ parsed, onConfirm, onClose }) {
  const [draft, setDraft] = useState(parsed || {});

  function upd(key, val) { setDraft(d => ({ ...d, [key]: val })); }

  const S = {
    label: { display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" },
    input: { width: "100%", padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box", resize: "vertical", fontFamily: "'Be Vietnam Pro', sans-serif", lineHeight: 1.5 },
    field: { marginBottom: "14px" },
    section: { marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f4f4f5" },
    sectionTitle: { fontSize: "12px", fontWeight: 700, color: "#09090b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" },
  };

  const FIELDS = [
    { section: "Brand", fields: [
      { key: "brandName", label: "Brand name", type: "input" },
      { key: "tagline", label: "Tagline", type: "input" },
      { key: "signatureLine", label: "Signature line", type: "input" },
      { key: "voiceRules", label: "Voice rules", type: "textarea", rows: 4, isArray: true },
    ]},
    { section: "Home page", fields: [
      { key: "heroHeadline", label: "Hero H1", type: "input" },
      { key: "heroSubhead", label: "Hero subhead", type: "textarea", rows: 2 },
      { key: "hookStatement", label: "Honest hook", type: "textarea", rows: 2 },
      { key: "differenceH2", label: "Difference H2", type: "input" },
      { key: "differenceBody", label: "Difference body", type: "textarea", rows: 2 },
      { key: "whoH2", label: "Who it is for H2", type: "input" },
      { key: "whoBody", label: "Who it is for body", type: "textarea", rows: 2 },
    ]},
    { section: "About & Process", fields: [
      { key: "aboutH1", label: "About H1", type: "input" },
      { key: "aboutStory", label: "Founder story", type: "textarea", rows: 3 },
      { key: "processH1", label: "Process H1", type: "input" },
      { key: "processIntro", label: "Process intro", type: "input" },
    ]},
    { section: "Contact", fields: [
      { key: "contactH1", label: "Contact H1", type: "input" },
      { key: "contactIntro", label: "Contact intro", type: "textarea", rows: 2 },
      { key: "contactReassurance", label: "Reassurance line", type: "input" },
    ]},
  ];

  const missingCount = FIELDS.flatMap(s => s.fields).filter(f => {
    const val = draft[f.key];
    return !val || (Array.isArray(val) ? val.length === 0 : val.trim() === "");
  }).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "680px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Review parsed brief</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              Fix anything before generating.
              {missingCount > 0 && <span style={{ marginLeft: "8px", color: "#f59e0b", fontWeight: 600 }}>{missingCount} blank field{missingCount !== 1 ? "s" : ""} — AI can draft these if you select "No" on copy settings.</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {draft.colors && Object.keys(draft.colors).length > 0 && (
            <div style={{ marginBottom: "20px", padding: "14px", background: "#f9f9f9", borderRadius: "8px" }}>
              <div style={S.sectionTitle}>Colors extracted</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {Object.entries(draft.colors).map(([name, hex]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: hex, border: "1px solid rgba(0,0,0,0.1)" }} />
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>{name}: {hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {FIELDS.map(section => (
            <div key={section.section} style={S.section}>
              <div style={S.sectionTitle}>{section.section}</div>
              {section.fields.map(f => {
                const val = draft[f.key];
                const displayVal = f.isArray && Array.isArray(val) ? val.join("\n") : (val || "");
                const isEmpty = !displayVal || displayVal.trim() === "";
                return (
                  <div key={f.key} style={S.field}>
                    <label style={{ ...S.label, color: isEmpty ? "#f59e0b" : "#6b7280" }}>
                      {f.label} {isEmpty && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— blank</span>}
                    </label>
                    {f.type === "input" ? (
                      <input style={{ ...S.input, borderColor: isEmpty ? "#fcd34d" : "#dde0e6" }} value={displayVal} onChange={e => upd(f.key, e.target.value)} placeholder={isEmpty ? "Not found in brief — type here to add" : ""} />
                    ) : (
                      <textarea rows={f.rows || 2} style={{ ...S.textarea, borderColor: isEmpty ? "#fcd34d" : "#dde0e6" }} value={displayVal} onChange={e => upd(f.key, f.isArray ? e.target.value.split("\n").filter(Boolean) : e.target.value)} placeholder={isEmpty ? "Not found in brief — type here to add" : ""} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", cursor: "pointer", color: "#6b7280" }}>Cancel</button>
          <button onClick={() => onConfirm(draft)} style={{ padding: "8px 24px", fontSize: "13px", fontWeight: 600, background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Looks good — use this brief →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Library helpers ───────────────────────────────────────────────────────────

function inferTags(brief, pages, layoutVariants) {
  var colors = brief.colors || {};
  var ink = (colors.ink || "#000000").toLowerCase();
  var bone = (colors.bone || colors["warm-white"] || "#ffffff").toLowerCase();
  var brass = (colors.brass || colors.accent || "").toLowerCase();

  // Visual style tags — inferred from color palette
  var visualTags = [];
  var isDark = ink === "#1c1a17" || ink === "#000000" || ink === "#09090b" || ink === "#111111";
  var isWarm = bone.indexOf("e") !== -1 || bone.indexOf("f3f1") !== -1 || bone.indexOf("ede") !== -1;
  var hasBrass = brass.indexOf("c2a") !== -1 || brass.indexOf("9c7") !== -1 || brass.indexOf("c49") !== -1;
  var hasGold = brass.indexOf("c49") !== -1 || brass.indexOf("d4a") !== -1;

  if (isDark) visualTags.push("dark-hero");
  if (isWarm) visualTags.push("warm-palette");
  if (hasBrass || hasGold) visualTags.push("brass-accent");

  // Layout style from variant choices
  var usedB = Object.values(layoutVariants || {}).some(function(v) { return v === "B"; });
  if (usedB) visualTags.push("editorial");
  if (!usedB) visualTags.push("structured");

  // Tone tags from voice rules
  var toneTags = [];
  var rules = (brief.voiceRules || []).join(" ").toLowerCase();
  if (rules.indexOf("confident") !== -1 || rules.indexOf("quiet") !== -1) toneTags.push("confident");
  if (rules.indexOf("plain") !== -1 || rules.indexOf("no buzzword") !== -1) toneTags.push("direct");
  if (rules.indexOf("warm") !== -1) toneTags.push("warm");
  if (rules.indexOf("premium") !== -1 || rules.indexOf("luxury") !== -1) toneTags.push("premium");
  if (rules.indexOf("minimal") !== -1 || rules.indexOf("simple") !== -1) toneTags.push("minimal");
  if (rules.indexOf("bold") !== -1 || rules.indexOf("strong") !== -1) toneTags.push("bold");

  // Industry fit — infer from brand name + brief context
  var context = [brief.brandName, brief.tagline, brief.whoBody, brief.hookStatement].join(" ").toLowerCase();
  var industryFit = [];
  if (context.match(/film|video|studio|production|shoot|edit/)) industryFit.push("video-production", "creative-agency", "photography");
  if (context.match(/industrial|manufacturing|plant|equipment|engineering/)) industryFit.push("industrial", "b2b-services");
  if (context.match(/founder|startup|venture|equity|investor|portfolio|pe\b/)) industryFit.push("founder-led", "private-equity", "consulting");
  if (context.match(/beauty|wellness|health|spa|skincare|lifestyle/)) industryFit.push("beauty", "wellness", "lifestyle");
  if (context.match(/agency|creative|design|brand|marketing/)) industryFit.push("creative-agency", "branding", "marketing");
  if (context.match(/law|legal|attorney|firm/)) industryFit.push("legal", "professional-services");
  if (context.match(/architect|interior|real estate|property/)) industryFit.push("architecture", "real-estate");
  if (context.match(/restaurant|food|hospitality|hotel/)) industryFit.push("hospitality", "food-beverage");
  if (context.match(/tech|software|saas|app|digital/)) industryFit.push("technology", "saas");
  if (industryFit.length === 0) industryFit.push("professional-services", "consulting");

  // Visual style summary label
  var styleLabel = [
    isDark ? "Dark" : "Light",
    isWarm ? "Warm" : "Cool",
    hasBrass ? "Brass Accent" : "",
    usedB ? "Editorial" : "Structured",
  ].filter(Boolean).join(" · ");

  return { visualTags: visualTags, toneTags: toneTags, industryFit: [...new Set(industryFit)], styleLabel: styleLabel };
}

async function saveToLibrary(brief, pages, layoutVariants, selectedVariants) {
  
  try {
    // ── Save full build ────────────────────────────────────────────────────
    var existing = [];
    try {
      var stored = await kvStorageGet("spec-template-library");
      if (stored && stored.value) existing = JSON.parse(stored.value);
    } catch(e) {}

    var tags = inferTags(brief, pages, selectedVariants || layoutVariants);
    var id = "build-" + Date.now();
    var entry = {
      id: id,
      client: brief.brandName || "Unnamed Client",
      date: new Date().toISOString().slice(0, 10),
      source: "blueprint",
      style: tags.styleLabel,
      tags: tags.visualTags.concat(tags.toneTags),
      visualTags: tags.visualTags,
      toneTags: tags.toneTags,
      industryFit: tags.industryFit,
      industryUsed: brief.brandName || "",
      description: [brief.tagline, brief.hookStatement].filter(Boolean).join(" — ") || "Custom build",
      colors: brief.colors || {},
      fonts: brief.fonts || [],
      voiceRules: brief.voiceRules || [],
      selectedVariants: selectedVariants || {},
      pages: pages.map(function(p) {
        return {
          id: p.id,
          label: p.label,
          variant: (selectedVariants || {})[p.id] || "A",
          data: (selectedVariants || {})[p.id] === "B" && p.variantB ? p.variantB : p.variantA || p.data,
        };
      }),
    };

    var deduped = existing.filter(function(e) {
      return !(e.client === entry.client && e.date === entry.date && e.source === "blueprint");
    });
    deduped.unshift(entry);
    if (deduped.length > 50) deduped = deduped.slice(0, 50);
    await kvStorageSet("spec-template-library", JSON.stringify(deduped));

    // ── Save individual sections ───────────────────────────────────────────
    var existingSections = [];
    try {
      var storedSections = await kvStorageGet("spec-section-library");
      if (storedSections && storedSections.value) existingSections = JSON.parse(storedSections.value);
    } catch(e) {}

    var newSections = [];
    pages.forEach(function(p) {
      var pageData = (selectedVariants || {})[p.id] === "B" && p.variantB ? p.variantB : p.variantA || p.data;
      if (!pageData || !pageData.content) return;
      pageData.content.forEach(function(section, si) {
        newSections.push({
          id: "section-" + Date.now() + "-" + si,
          buildId: id,
          client: brief.brandName || "Unnamed Client",
          date: new Date().toISOString().slice(0, 10),
          pageId: p.id,
          pageLabel: p.label,
          sectionIndex: si,
          colors: brief.colors || {},
          tags: tags.visualTags.concat(tags.toneTags),
          industryFit: tags.industryFit,
          data: section,
        });
      });
    });

    var combinedSections = newSections.concat(existingSections);
    if (combinedSections.length > 300) combinedSections = combinedSections.slice(0, 300);
    await kvStorageSet("spec-section-library", JSON.stringify(combinedSections));

  } catch(e) {
    console.warn("saveToLibrary failed:", e);
  }
}

const ALL_PAGES = [
  { id: "home",        label: "Home",                slug: "/" },
  { id: "work",        label: "Work / Portfolio",     slug: "/work" },
  { id: "services",    label: "Services & Pricing",   slug: "/services" },
  { id: "about",       label: "About",                slug: "/about" },
  { id: "process",     label: "Process",              slug: "/process" },
  { id: "contact",     label: "Contact",              slug: "/contact" },
];

const ADDITIONAL_PAGE_TYPES = [
  { id: "landing",       label: "Landing Page",         slug: "/landing" },
  { id: "team",          label: "Team",                 slug: "/team" },
  { id: "blog",          label: "Blog / Journal",       slug: "/blog" },
  { id: "blog-post",     label: "Blog Post",            slug: "/blog/post" },
  { id: "case-study",    label: "Case Study",           slug: "/case-study" },
  { id: "testimonials",  label: "Testimonials",         slug: "/testimonials" },
  { id: "faq",           label: "FAQ",                  slug: "/faq" },
  { id: "pricing",       label: "Pricing",              slug: "/pricing" },
  { id: "portfolio",     label: "Portfolio Single",     slug: "/portfolio/project" },
  { id: "events",        label: "Events",               slug: "/events" },
  { id: "event-single",  label: "Event Single",         slug: "/events/event" },
  { id: "location",      label: "Location",             slug: "/location" },
  { id: "careers",       label: "Careers",              slug: "/careers" },
  { id: "press",         label: "Press / Media",        slug: "/press" },
  { id: "partners",      label: "Partners",             slug: "/partners" },
  { id: "resources",     label: "Resources",            slug: "/resources" },
  { id: "downloads",     label: "Downloads",            slug: "/downloads" },
  { id: "thank-you",     label: "Thank You",            slug: "/thank-you" },
  { id: "privacy",       label: "Privacy Policy",       slug: "/privacy-policy" },
  { id: "terms",         label: "Terms of Service",     slug: "/terms" },
  { id: "404",           label: "404",                  slug: "/404" },
];

// ─── Elementor helpers ────────────────────────────────────────────────────────
function nid() { return Math.random().toString(16).slice(2, 9); }

function rPad(padY, padX) {
  padX = padX || "40";
  var y = parseInt(padY); var x = parseInt(padX);
  var yt = Math.round(y * 0.7); var ym = Math.round(y * 0.55);
  var xt = Math.min(parseInt(padX), 32);
  return {
    padding:        { unit:"px", top:String(y),  right:String(x),  bottom:String(y),  left:String(x),  isLinked:false },
    padding_tablet: { unit:"px", top:String(yt), right:String(xt), bottom:String(yt), left:String(xt), isLinked:false },
    padding_mobile: { unit:"px", top:String(ym), right:"20",       bottom:String(ym), left:"20",        isLinked:false },
  };
}

function rFont(px) {
  if (!px) return {};
  var t = Math.max(16, Math.round(px * 0.68));
  var m = Math.max(16, Math.round(px * 0.50));
  return {
    typography_font_size:        { unit:"px", size: px },
    typography_font_size_tablet: { unit:"px", size: t  },
    typography_font_size_mobile: { unit:"px", size: m  },
    typography_line_height:        { unit:"em", size: 1.1 },
    typography_line_height_tablet: { unit:"em", size: 1.15 },
    typography_line_height_mobile: { unit:"em", size: 1.2 },
  };
}

function mkContainer(children, bg, opts) {
  opts = opts || {};
  var direction = opts.direction || "column";
  var s = {
    content_width: "boxed",
    flex_direction: direction,
    flex_gap: { unit:"px", size: opts.gap||"20", column: opts.gap||"20", row: opts.gap||"20" },
    // Mobile gap — tighter when stacking vertically
    flex_gap_mobile: { unit:"px", size: "16", column: "16", row: "16" },
  };
  var padSettings = rPad(opts.padY || "80", opts.padX || "40");
  Object.assign(s, padSettings);
  if (bg) { s.background_background = "classic"; s.background_color = bg; }
  if (opts.minH) {
    s.min_height = { unit:"vh", size: opts.minH };
    s.min_height_tablet = { unit:"vh", size: Math.round(opts.minH * 0.75) };
    s.min_height_mobile = { unit:"px", size: 480 };
    s.justify_content = "center";
    s.justify_content_tablet = "center";
    s.justify_content_mobile = "center";
  }
  if (opts.center) {
    s.align_items = "center";
    s.align_items_tablet = "center";
    s.align_items_mobile = "center";
    s.text_align = "center";
    s.text_align_tablet = "center";
    s.text_align_mobile = "center";
  }
  if (opts.grow) {
    s._flex_grow = opts.grow;
    // Full width when stacked on mobile
    s.width_mobile = { unit:"%", size: 100 };
    s.width_tablet = { unit:"%", size: 100 };
  }
  if (direction === "row" && !opts.keepRow) {
    s.flex_direction_tablet = "column";
    s.flex_direction_mobile = "column";
    s.align_items_tablet = "flex-start";
    s.align_items_mobile = "flex-start";
  }
  if (direction === "row" && opts.buttonRow) {
    s.flex_direction_tablet = "row";
    s.flex_direction_mobile = "column";
    s.align_items_mobile = "center";
    s.flex_wrap_mobile = "wrap";
  }
  return { id: nid(), elType: "container", isInner: !!opts.isInner, settings: s, elements: children };
}

function mkHeading(text, color, size, opts) {
  opts = opts || {};
  var s = {
    title: text,
    header_size: size,
    title_color: color,
    align: opts.align || "left",
    align_tablet: opts.align || "left",
    align_mobile: "left", // always left on mobile unless explicitly centered
  };
  // Center align on mobile only for centered sections
  if (opts.align === "center") s.align_mobile = "center";
  if (opts.eyebrow) {
    s.typography_typography = "custom";
    s.typography_font_family = "Inter";
    s.typography_font_weight = "600";
    s.typography_text_transform = "uppercase";
    s.typography_letter_spacing = { unit:"px", size: 2.5 };
    s.typography_letter_spacing_mobile = { unit:"px", size: 2 };
    s.typography_font_size =        { unit:"px", size: 12 };
    s.typography_font_size_tablet = { unit:"px", size: 11 };
    s.typography_font_size_mobile = { unit:"px", size: 10 };
  } else {
    if (opts.font || opts.weight || opts.px || opts.italic) {
      s.typography_typography = "custom";
      if (opts.font)   s.typography_font_family = opts.font;
      if (opts.weight) s.typography_font_weight = String(opts.weight);
      if (opts.italic) s.typography_font_style = "italic";
      Object.assign(s, rFont(opts.px));
    }
  }
  return { id: nid(), elType: "widget", widgetType: "heading", settings: s, elements: [] };
}

function mkText(html, color, align) {
  align = align || "left";
  var s = {
    editor: "<p>" + html + "</p>",
    text_color: color,
    typography_typography: "custom",
    typography_font_size:        { unit:"px", size: 17 },
    typography_font_size_tablet: { unit:"px", size: 16 },
    typography_font_size_mobile: { unit:"px", size: 15 },
    typography_line_height:        { unit:"em", size: 1.65 },
    typography_line_height_tablet: { unit:"em", size: 1.6  },
    typography_line_height_mobile: { unit:"em", size: 1.55 },
  };
  if (align === "center") {
    s.text_align = "center";
    s.text_align_tablet = "center";
    s.text_align_mobile = "left"; // revert to left on mobile for readability
  }
  return { id: nid(), elType: "widget", widgetType: "text-editor", settings: s, elements: [] };
}

function mkButton(label, bgColor, textColor) {
  return { id: nid(), elType: "widget", widgetType: "button",
    settings: {
      text: label, link: { url: "#" },
      background_color: bgColor, button_text_color: textColor,
      border_radius: { unit:"px", top:"2", right:"2", bottom:"2", left:"2", isLinked:true },
      typography_typography: "custom", typography_font_family: "Inter",
      typography_font_weight: "600", typography_text_transform: "uppercase",
      typography_letter_spacing: { unit:"px", size: 1.5 },
      typography_font_size:        { unit:"px", size: 13 },
      typography_font_size_tablet: { unit:"px", size: 13 },
      typography_font_size_mobile: { unit:"px", size: 13 },
      padding:        { unit:"px", top:"16", right:"32", bottom:"16", left:"32", isLinked:false },
      padding_tablet: { unit:"px", top:"14", right:"28", bottom:"14", left:"28", isLinked:false },
      padding_mobile: { unit:"px", top:"14", right:"24", bottom:"14", left:"24", isLinked:false },
    }, elements: [] };
}

function mkImagePh(caption) {
  return { id: nid(), elType: "widget", widgetType: "image",
    settings: { image: { url:"", id:"" }, caption_source:"custom", caption: caption||"" },
    elements: [] };
}

function mkSpacer(px) {
  return { id: nid(), elType: "widget", widgetType: "spacer",
    settings: {
      space:        { unit:"px", size: px },
      space_tablet: { unit:"px", size: Math.round(px * 0.7) },
      space_mobile: { unit:"px", size: Math.round(px * 0.5) },
    }, elements: [] };
}

function mkDivider(color) {
  return { id: nid(), elType: "widget", widgetType: "divider",
    settings: { color: color || "#E2DBCC", weight: { unit:"px", size: 1 } },
    elements: [] };
}

// ─── Page builders ────────────────────────────────────────────────────────────

// ─── Header builder ───────────────────────────────────────────────────────────
function buildHeaderJSON(C, brief, inspoContext) {
  var ink = C.ink || "#1C1A17";
  var brass = C.brass || "#C2A35B";
  var brassDp = C["brass-deep"] || "#9C7E3A";
  var bone = C.bone || "#EDE7DB";
  var warmWhite = C["warm-white"] || "#FBFAF7";

  // Determine header style from inspo context
  var inspo = (inspoContext || "").toLowerCase();
  var isDark = inspo.indexOf("dark header") !== -1 || inspo.indexOf("dark nav") !== -1 || inspo.indexOf("dark background nav") !== -1;
  var isTransparent = inspo.indexOf("transparent") !== -1 || inspo.indexOf("overlay") !== -1;
  var isCentered = inspo.indexOf("centered logo") !== -1 || inspo.indexOf("center logo") !== -1;

  var bgColor = isDark ? ink : isTransparent ? "rgba(0,0,0,0)" : "#ffffff";
  var textColor = isDark ? warmWhite : ink;
  var borderColor = isDark ? "rgba(255,255,255,0.1)" : "#dde0e6";

  // Nav links from brief
  var navLinks = (brief.headerNav || ["Home", "Work", "Services", "About", "Process", "Contact"]);
  var navLinkWidgets = navLinks.map(function(label) {
    return {
      id: nid(),
      elType: "widget",
      widgetType: "nav-menu",
      settings: {
        menu: label,
        layout: "horizontal",
        nav_menu_typography_typography: "custom",
        nav_menu_typography_font_family: "Inter",
        nav_menu_typography_font_weight: "500",
        nav_menu_typography_font_size: { unit: "px", size: 14 },
        color: textColor,
        color_hover: brass,
        mobile_breakpoint: "tablet",
      },
      elements: []
    };
  });

  // Logo widget
  var logoWidget = {
    id: nid(),
    elType: "widget",
    widgetType: "heading",
    settings: {
      title: brief.brandName || "Brand Name",
      header_size: "h4",
      title_color: isDark ? warmWhite : ink,
      typography_typography: "custom",
      typography_font_family: (brief.fonts && brief.fonts[0]) || "Inter",
      typography_font_weight: "800",
      typography_font_size: { unit: "px", size: 20 },
    },
    elements: []
  };

  // CTA button
  var ctaBtn = mkButton(brief.headerCta || "Start a project", brassDp, "#ffffff");
  ctaBtn.settings.padding = { unit: "px", top: "12", right: "24", bottom: "12", left: "24", isLinked: false };

  // Nav menu widget — single widget for all links
  var navMenuWidget = {
    id: nid(),
    elType: "widget",
    widgetType: "nav-menu",
    settings: {
      layout: "horizontal",
      nav_menu_typography_typography: "custom",
      nav_menu_typography_font_family: "Inter",
      nav_menu_typography_font_weight: "500",
      nav_menu_typography_font_size: { unit: "px", size: 14 },
      color: textColor,
      color_hover: brass,
      mobile_breakpoint: "tablet",
      pointer: "none",
      item_gap: { unit: "px", size: 32 },
    },
    elements: []
  };

  // Layout: logo left, nav center/right, CTA right
  var logoCol = mkContainer([logoWidget], null, { padY: "0", isInner: true });
  logoCol.settings._flex_grow = 0;

  var navCol = mkContainer([navMenuWidget], null, { padY: "0", isInner: true });
  navCol.settings._flex_grow = 1;
  navCol.settings.justify_content = isCentered ? "center" : "flex-end";

  var ctaCol = mkContainer([ctaBtn], null, { padY: "0", isInner: true });
  ctaCol.settings._flex_grow = 0;

  var headerRow = mkContainer([logoCol, navCol, ctaCol], null, {
    direction: "row", gap: "24", padY: "0", isInner: false
  });
  headerRow.settings.align_items = "center";
  headerRow.settings.padding = { unit: "px", top: "16", right: "40", bottom: "16", left: "40", isLinked: false };
  headerRow.settings.padding_tablet = { unit: "px", top: "14", right: "24", bottom: "14", left: "24", isLinked: false };
  headerRow.settings.padding_mobile = { unit: "px", top: "12", right: "16", bottom: "12", left: "16", isLinked: false };

  if (bgColor !== "rgba(0,0,0,0)") {
    headerRow.settings.background_background = "classic";
    headerRow.settings.background_color = bgColor;
  }

  headerRow.settings.border_border = "solid";
  headerRow.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "1", left: "0", isLinked: false };
  headerRow.settings.border_color = borderColor;

  return {
    version: "0.4",
    title: (brief.brandName || "Site") + " — Header",
    type: "header",
    page_settings: {},
    content: [headerRow]
  };
}

// ─── Footer builder ───────────────────────────────────────────────────────────
function buildFooterJSON(C, brief, inspoContext) {
  var ink = C.ink || "#1C1A17";
  var brass = C.brass || "#C2A35B";
  var brassDp = C["brass-deep"] || "#9C7E3A";
  var bone = C.bone || "#EDE7DB";
  var warmWhite = C["warm-white"] || "#FBFAF7";
  var stone = C.stone || "#8A8170";
  var text = C.text || "#2A2722";

  var inspo = (inspoContext || "").toLowerCase();
  var isDark = inspo.indexOf("dark footer") !== -1 || inspo.indexOf("dark background footer") !== -1;
  // Default footer to dark ink — common pattern for premium brands
  var bgColor = isDark || true ? ink : bone;
  var textColor = bgColor === ink ? warmWhite : text;
  var mutedColor = bgColor === ink ? stone : stone;

  var navLinks = brief.headerNav || ["Home", "Work", "Services", "About", "Process", "Contact"];

  // Brand column — logo, tagline, signature
  var brandCol = mkContainer([
    mkHeading(brief.brandName || "Brand Name", textColor, "h4", { weight: 800 }),
    mkSpacer(12),
    mkText(brief.tagline || "", mutedColor),
    mkSpacer(8),
    mkText(brief.signatureLine || "", mutedColor),
    mkSpacer(20),
    brief.contactEmail ? mkText(brief.contactEmail, mutedColor) : mkSpacer(0),
  ], null, { padY: "0", grow: 1, isInner: true });

  // Nav column
  var navItems = navLinks.map(function(label) {
    return mkHeading(label, mutedColor, "h6", { weight: 400 });
  });
  var navCol = mkContainer([
    mkHeading("Pages", brass, "h6", { eyebrow: true }),
    mkSpacer(16),
  ].concat(navItems), null, { padY: "0", grow: 1, isInner: true });

  // Determine footer style from inspo
  var isMinimal = inspo.indexOf("minimal footer") !== -1 || inspo.indexOf("simple footer") !== -1;

  var footerRow, copyrightRow;

  if (isMinimal) {
    // Minimal: one row with logo + nav + copyright
    var minimalRow = mkContainer([
      mkHeading(brief.brandName || "Brand Name", textColor, "h5", { weight: 800 }),
      mkContainer(navLinks.map(function(l) { return mkHeading(l, mutedColor, "h6", { weight: 400 }); }),
        null, { direction: "row", gap: "24", padY: "0", isInner: true }),
      mkText("© " + new Date().getFullYear() + " " + (brief.brandName || ""), mutedColor),
    ], null, { direction: "row", gap: "40", padY: "0", isInner: false });
    minimalRow.settings.align_items = "center";
    minimalRow.settings.padding = { unit: "px", top: "32", right: "40", bottom: "32", left: "40", isLinked: false };
    minimalRow.settings.background_background = "classic";
    minimalRow.settings.background_color = bgColor;
    minimalRow.settings.border_border = "solid";
    minimalRow.settings.border_width = { unit: "px", top: "1", right: "0", bottom: "0", left: "0", isLinked: false };
    minimalRow.settings.border_color = "rgba(255,255,255,0.1)";

    return {
      version: "0.4",
      title: (brief.brandName || "Site") + " — Footer",
      type: "footer",
      page_settings: {},
      content: [minimalRow]
    };
  }

  // Standard multi-column footer
  var mainRow = mkContainer([brandCol, navCol], null, {
    direction: "row", gap: "64", padY: "0", isInner: false
  });
  mainRow.settings.padding = { unit: "px", top: "64", right: "40", bottom: "48", left: "40", isLinked: false };
  mainRow.settings.padding_tablet = { unit: "px", top: "48", right: "24", bottom: "40", left: "24", isLinked: false };
  mainRow.settings.padding_mobile = { unit: "px", top: "40", right: "20", bottom: "32", left: "20", isLinked: false };
  mainRow.settings.background_background = "classic";
  mainRow.settings.background_color = bgColor;

  // Copyright row
  var copyrightBar = mkContainer([
    mkText("© " + new Date().getFullYear() + " " + (brief.brandName || "") + ". All rights reserved.", mutedColor),
    brief.footerTagline ? mkText(brief.footerTagline, mutedColor) : mkSpacer(0),
  ], null, { direction: "row", gap: "24", padY: "0", isInner: false });
  copyrightBar.settings.padding = { unit: "px", top: "20", right: "40", bottom: "20", left: "40", isLinked: false };
  copyrightBar.settings.padding_mobile = { unit: "px", top: "16", right: "20", bottom: "16", left: "20", isLinked: false };
  copyrightBar.settings.background_background = "classic";
  copyrightBar.settings.background_color = bgColor;
  copyrightBar.settings.border_border = "solid";
  copyrightBar.settings.border_width = { unit: "px", top: "1", right: "0", bottom: "0", left: "0", isLinked: false };
  copyrightBar.settings.border_color = "rgba(255,255,255,0.08)";
  copyrightBar.settings.justify_content = "space-between";
  copyrightBar.settings.align_items = "center";

  return {
    version: "0.4",
    title: (brief.brandName || "Site") + " — Footer",
    type: "footer",
    page_settings: {},
    content: [mainRow, copyrightBar]
  };
}


// Returns true if any keyword appears in the inspo hint string.
// Used by page builders to pick which layout variant to recommend.
function inspoMatchesVariant(hint, keywords) {
  if (!hint) return false;
  var lower = hint.toLowerCase();
  return keywords.some(function(k) { return lower.indexOf(k) !== -1; });
}

function buildHomePage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      asphalt = C.asphalt, brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;
  var heroPattern = (patterns && patterns.hero) || "centered-bold";

  // ── HERO — pattern-driven ──────────────────────────────────────────────────
  var hero;
  if (heroPattern === "split-left") {
    // Text left, image placeholder right
    var heroTextCol = mkContainer([
      mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1", { weight: 800, px: 56 }),
      mkSpacer(24),
      mkText(brief.heroSubhead || "Your subheadline here.", warmWhite),
      mkSpacer(40),
      mkContainer([
        mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff"),
        mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
      ], null, { direction: "row", gap: "16", padY: "0", isInner: true, buttonRow: true }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var heroImgCol = mkContainer([
      mkImagePh("Hero image"),
    ], null, { padY: "0", grow: 1, isInner: true });
    var heroRow = mkContainer([heroTextCol, heroImgCol], null, { direction: "row", gap: "64", padY: "0", isInner: true });
    hero = mkContainer([heroRow], ink, { padY: "80" });
  } else if (heroPattern === "split-right") {
    // Image placeholder left, text right
    var heroImgColR = mkContainer([
      mkImagePh("Hero image"),
    ], null, { padY: "0", grow: 1, isInner: true });
    var heroTextColR = mkContainer([
      mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1", { weight: 800, px: 56 }),
      mkSpacer(24),
      mkText(brief.heroSubhead || "Your subheadline here.", warmWhite),
      mkSpacer(40),
      mkContainer([
        mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff"),
        mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
      ], null, { direction: "row", gap: "16", padY: "0", isInner: true, buttonRow: true }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var heroRowR = mkContainer([heroImgColR, heroTextColR], null, { direction: "row", gap: "64", padY: "0", isInner: true });
    hero = mkContainer([heroRowR], ink, { padY: "80" });
  } else if (heroPattern === "minimal") {
    // Large whitespace, minimal text, no image
    hero = mkContainer([
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1",
        { font: "Fraunces", weight: 300, px: 80, align: "center" }),
      mkSpacer(48),
      mkContainer([mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff")],
        null, { padY: "0", center: true, isInner: true }),
    ], ink, { padY: "140", minH: 80, center: true });
  } else {
    // centered-bold / full-image / default — centered layout
    hero = mkContainer([
      mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true, align: "center" }),
      mkSpacer(24),
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1",
        { font: "Fraunces", weight: 300, px: 72, align: "center" }),
      mkSpacer(28),
      mkText(brief.heroSubhead || "Your subheadline here.", warmWhite, "center"),
      mkSpacer(40),
      mkContainer([
        mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff"),
        mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
      ], null, { direction: "row", gap: "16", padY: "0", center: true, isInner: true, buttonRow: true }),
    ], ink, { padY: "80", minH: 0, center: true });
  }

  var hook = mkContainer([
    mkHeading(brief.hookStatement || "Your honest hook statement.", ink, "h2",
      { font: "Inter", weight: 700, px: 36, align: "center" }),
  ], bone, { padY: "60", center: true });

  var cards = (function() {
    var cds = (brief.serviceCards || [
      ["Proof", "Testimonials and case studies that help your team close."],
      ["People", "Recruiting, origin stories, the human core of the company."],
      ["Brand", "Founder stories, vision, the company's own voice."],
      ["Exit", "The story a business shows when it is ready to be bought."],
    ]).map(function(pair) {
      var title = pair[0]; var body = pair[1];
      var c = mkContainer([
        mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
        mkSpacer(8),
        mkText(body, stone),
      ], "#ffffff", { padY: "32", isInner: true });
      c.settings.border_border = "solid";
      c.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "0", left: "3", isLinked: false };
      c.settings.border_color = brass;
      c.settings.padding = { unit: "px", top: "32", right: "28", bottom: "32", left: "28", isLinked: false };
      c.settings._flex_grow = 1;
      return c;
    });
    var row = mkContainer(cds, null, { direction: "row", gap: "20", padY: "0", isInner: true });
    row.settings.flex_wrap = "wrap";
    return mkContainer([row], bone, { padY: "80" });
  })();

  var split = (function() {
    var left = mkContainer([
      mkHeading(brief.differenceEyebrow || "Why one maker", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.differenceH2 || "One person. The whole film.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var right = mkContainer([
      mkText(brief.differenceBody || "[The difference — explain what sets this apart. Pulled from brand brief.]", text),
    ], null, { padY: "0", grow: 1, isInner: true });
    var row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true });
    return mkContainer([row], bone, { padY: "96" });
  })();

  var whoSection = (function() {
    var left = mkContainer([
      mkHeading(brief.whoEyebrow || "Who it is for", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.whoH2 || "For the underfilmed.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var right = mkContainer([
      mkText(brief.whoBody || "[Who this is for — pulled from brand brief. Describe the ideal client specifically.]", text),
    ], null, { padY: "0", grow: 1, isInner: true });
    var row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true });
    return mkContainer([row], bone, { padY: "96" });
  })();

  var work = mkContainer([
    mkHeading(brief.workH2 || "Recent work.", ink, "h2", { px: 44, weight: 800 }),
    mkSpacer(48),
    mkContainer(
      (brief.workItems || ["Film 1","Film 2","Film 3"]).map(function(w) {
        return mkContainer([mkImagePh(w), mkSpacer(12), mkText("<strong>" + w + "</strong>", stone)],
          null, { padY: "0", grow: 1, isInner: true });
      }), null, { direction: "row", gap: "24", padY: "0", isInner: true }
    ),
  ], bone, { padY: "80" });

  var pricingTeaser = mkContainer([
    mkHeading(brief.pricingH2 || "Clear prices. No discovery-call maze.", ink, "h2",
      { px: 44, weight: 800, align: "center" }),
    mkSpacer(24),
    mkText(brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open.", stone, "center"),
    mkSpacer(40),
    mkContainer([mkButton(brief.pricingCta || "See packages", brassDp, "#ffffff")],
      null, { padY: "0", center: true, isInner: true }),
  ], bone, { padY: "112", center: true });

  var closing = mkContainer([
    mkHeading(brief.tagline || "The stories that move a company forward.", warmWhite, "h1",
      { font: "Fraunces", weight: 300, px: 64, italic: true, align: "center" }),
    mkSpacer(48),
    mkContainer([mkButton(brief.closingCta || "Start a project", brassDp, "#ffffff")],
      null, { padY: "0", center: true, isInner: true }),
  ], ink, { padY: "120", minH: 70, center: true });

  return { version: "0.4", title: "Home", type: "page", page_settings: {},
    content: [hero, hook, cards, split, whoSection, work, pricingTeaser, closing] };
}

function buildWorkPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt, text = C.text;

  var header = mkContainer([
    mkHeading(brief.workEyebrow || "Work", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.workH1 || "Selected work.", ink, "h1", { weight: 800, px: 64 }),
    mkSpacer(16),
    mkText(brief.workIntro || "A look at the stories so far. Customer and team films, brand work, and the films that help a company show what it has become.", text),
  ], bone, { padY: "88" });

  var closing = mkContainer([mkButton("Start a project", brassDp, "#ffffff")], bone, { padY: "80", center: true });

  // ── Variant A: Standard grid with filter row ──────────────────────────────
  var filterCategories = brief.workCategories || ["All", "Stories & testimonials", "People & culture", "Brand & leadership", "Exit"];
  var filterRow = mkContainer([
    mkContainer(
      filterCategories.map(function(label, i) {
        var btn = mkButton(label, i === 0 ? brass : "transparent", i === 0 ? ink : brassDp);
        btn.settings.border_border = "solid";
        btn.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
        btn.settings.border_color = i === 0 ? brass : brassDp;
        btn.settings.padding = { unit:"px", top:"10", right:"20", bottom:"10", left:"20", isLinked:false };
        return btn;
      }), null, { direction: "row", gap: "10", padY: "0", isInner: true }
    ),
  ], bone, { padY: "24", padX: "40" });

  var gridTiles = (brief.workItems || []).map(function(title) {
    var tile = mkContainer([
      mkImagePh(title),
      mkSpacer(16),
      mkHeading(title, ink, "h4", { weight: 700 }),
      mkSpacer(4),
      mkText("[Project type — fill in]", stone),
      mkSpacer(4),
      mkText("[One line of context about this project]", stone),
    ], "#ffffff", { padY: "0", isInner: true });
    tile.settings.border_border = "solid";
    tile.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
    tile.settings.border_color = "#E2DBCC";
    tile.settings._flex_grow = 1;
    return tile;
  });

  // If no work items in brief, show flagged placeholder tiles
  if (gridTiles.length === 0) {
    for (var wi = 0; wi < 6; wi++) {
      var pt = mkContainer([
        mkImagePh("[Upload project image " + (wi+1) + "]"),
        mkSpacer(16),
        mkHeading("[Project title " + (wi+1) + "]", ink, "h4", { weight: 700 }),
        mkSpacer(4),
        mkText("[Project type]", stone),
      ], "#ffffff", { padY: "0", isInner: true });
      pt.settings.border_border = "solid";
      pt.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
      pt.settings.border_color = "#E2DBCC";
      pt.settings._flex_grow = 1;
      gridTiles.push(pt);
    }
  }
  var grid = mkContainer(gridTiles, null, { direction: "row", gap: "24", padY: "0", isInner: true });
  grid.settings.flex_wrap = "wrap";
  var gridSection = mkContainer([grid], bone, { padY: "64" });

  var variantA = { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [header, filterRow, gridSection, closing] };

  // ── Variant B: Editorial — featured hero tile + supporting grid ───────────
  var items = brief.workItems || [];
  var featured = items[0] || "[Featured project title]";
  var featuredTile = mkContainer([
    mkContainer([
      mkImagePh(featured),
    ], null, { padY: "0", grow: 1, isInner: true }),
    mkContainer([
      mkHeading("Featured", brass, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(featured, ink, "h2", { weight: 800, px: 44 }),
      mkSpacer(12),
      mkText("[Add a one paragraph description of this project when publishing.]", text),
      mkSpacer(24),
      mkButton("View project", brassDp, "#ffffff"),
    ], null, { padY: "48", grow: 1, isInner: true }),
  ], "#ffffff", { direction: "row", gap: "0", padY: "0" });
  featuredTile.settings.border_border = "solid";
  featuredTile.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  featuredTile.settings.border_color = "#E2DBCC";

  var supportingItems = items.length > 1 ? items.slice(1) : ["[Project 2]", "[Project 3]", "[Project 4]", "[Project 5]"];
  var supportingTiles = supportingItems.map(function(title) {
    var t = mkContainer([
      mkImagePh(title),
      mkSpacer(12),
      mkHeading(title, ink, "h4", { weight: 700 }),
      mkSpacer(4),
      mkText("[Project type]", stone),
    ], "#ffffff", { padY: "24", isInner: true });
    t.settings.border_border = "solid";
    t.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
    t.settings.border_color = "#E2DBCC";
    t.settings._flex_grow = 1;
    return t;
  });
  var supportingRow = mkContainer(supportingTiles, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  supportingRow.settings.flex_wrap = "wrap";

  var editorialSection = mkContainer([featuredTile, mkSpacer(20), supportingRow], bone, { padY: "64" });

  var variantB = { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [header, editorialSection, closing] };

  // Recommend B if inspo hints suggest editorial/featured/case-study style
  var recommended = inspoMatchesVariant(inspoHint, ["editorial", "featured", "case study", "full bleed", "hero image", "spotlight"])
    ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

function buildServicesPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt || "#2B2823", text = C.text;

  var header = mkContainer([
    mkHeading("Services & pricing", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading("Every way to put your company on film.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(20),
    mkText("Real prices, in the open. Pick a package, or build a plan. No 30 minute call required to learn what something costs.", text),
  ], bone, { padY: "88" });

  // Three tiers on dark background
  var tiers = (brief.pricingTiers || [
    ["01  Front Door", "CASH FLOW & TRUST", "Productized story and testimonial packages with set scope and open pricing. The simple way to start working together.", "From 2.5K per film"],
    ["02  Premium", "MARGIN & CRAFT", "Brand films, founder stories, and exit work. Built around your story and priced to the project. The films that move the needle.", "From 12K per film"],
    ["03  The Partner Plan", "RECURRING", "An embedded video partner across your portfolio or for one company. Predictable monthly output, no constant re-quoting.", "From 4K per month"],
  ]).map(function(tier) {
    var name = tier[0]; var sub = tier[1]; var desc = tier[2]; var price = tier[3];
    var card = mkContainer([
      mkHeading(name, warmWhite, "h3", { weight: 700, px: 28 }),
      mkSpacer(6),
      mkHeading(sub || "", stone, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkDivider("#4a4640"),
      mkSpacer(20),
      mkText(desc || "", warmWhite),
      mkSpacer(24),
      mkHeading(price || "", brass, "h3", { weight: 700, px: 32 }),
    ], asphalt, { padY: "48", padX: "36", isInner: true });
    card.settings._flex_grow = 1;
    return card;
  });

  var tiersRow = mkContainer(tiers, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  tiersRow.settings.flex_wrap = "wrap";

  // Always included block
  var alwaysIncluded = mkContainer([
    mkHeading("Always included, in every package", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("A set number of revision rounds, agreed up front, so feedback never runs open-ended. Professional lighting and audio, color grading, and a licensed music track. Delivery in web and social formats, plus short cutdowns from the same footage.", text),
  ], "#ffffff", { padY: "32", padX: "36", isInner: true });
  alwaysIncluded.settings.border_border = "solid";
  alwaysIncluded.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  alwaysIncluded.settings.border_color = "#E2DBCC";

  var tiersSection = mkContainer([tiersRow, mkSpacer(24), alwaysIncluded], ink, { padY: "80" });

  // Full menu — grouped by category
  var menuCategories = [
    {
      label: "Proof & Trust",
      items: [
        ["Customer Story", "2.5K to 4.5K", "A customer tells their before and after, in their own words.", "Half-day shoot at one location, 1 to 2 minute edit, 2 social cutdowns, 2 revision rounds."],
        ["Case Study Film", "4K to 8K", "Problem, solution, and the measurable result.", "One or two locations, on-screen data and graphics, 2 to 3 minute edit, 3 cutdowns."],
        ["Partner Testimonial", "2.5K to 4.5K", "A vendor or partner vouches for you on camera.", "Half-day shoot, 1 to 2 minute edit, 2 cutdowns."],
        ["Sales Reel", "5K to 10K", "A short capabilities film the team can send to help close.", "Multi-location shoot, b-roll, 2 to 3 minute edit."],
      ]
    },
    {
      label: "People & Culture",
      items: [
        ["Technician Origin Story", "3K to 6K", "Where one of your people came from, and why they stay. The signature piece.", "Half to full-day shoot, 2 to 3 minute edit, photo stills."],
        ["Day in the Life", "2.5K to 4.5K", "A teammate's real workday, told simply.", "Half-day shoot, 1 to 2 minute edit, 2 cutdowns."],
        ["Why Work Here", "4K to 8K", "The recruiting film that fills your pipeline.", "Full-day shoot, several voices, 2 minute edit plus 30 and 60 second cuts."],
        ["Culture & Values Film", "6K to 12K", "What the company stands for, on screen.", "Multi-location shoot, 2 to 4 minute edit, cutdowns."],
      ]
    },
    {
      label: "Leadership & Vision",
      items: [
        ["Founder Story", "6K to 15K", "The origin of the company, told with weight.", "Interview and b-roll, archival photo integration, 3 to 5 minute edit."],
        ["Leadership Address", "3K to 6K", "A clear message from the top, to the team or the market.", "Studio or on-site shoot, teleprompter, 1 to 3 minute edit."],
        ["Vision Film", "6K to 12K", "Where the company is headed next.", "Shoot, motion graphics, 2 to 3 minute edit."],
        ["All-Hands Video", "2.5K to 5K", "Internal comms people actually watch.", "Shoot, 1 to 3 minute edit."],
      ]
    },
    {
      label: "Exit & Value Creation",
      items: [
        ["About-Us Brand Film", "12K to 30K", "The company's story, beautifully told, for the website.", "Multi-day or multi-location shoot, original music, 2 to 4 minute edit, cutdowns."],
        ["Exit-Ready Company Film", "25K to 75K+", "The narrative buyers see in the room. Built for the data room and the management presentation.", "Discovery, scripting, multi-location shoot, leadership and customer voices, 3 to 6 minute edit, plus short cuts."],
        ["Milestone Film", "10K to 20K", "Mark a major moment during the hold period.", "Shoot, 2 to 4 minute edit."],
        ["Portfolio Showcase", "Custom", "One film template across many portfolio companies, made for the firm.", "A repeatable format and a per-company rate. Scoped with the firm."],
      ]
    },
  ];

  var menuSections = menuCategories.map(function(cat) {
    var rows = cat.items.map(function(item) {
      var name = item[0]; var price = item[1]; var desc = item[2]; var incl = item[3];
      var namePrice = mkContainer([
        mkHeading(name, ink, "h4", { weight: 700, px: 18 }),
        mkHeading(price, brassDp, "h5", { weight: 600 }),
      ], null, { direction: "row", gap: "20", padY: "0", isInner: true });
      var row = mkContainer([
        namePrice,
        mkSpacer(8),
        mkText(desc, text),
        mkSpacer(4),
        mkText("<em>Includes: " + incl + "</em>", stone),
        mkSpacer(20),
        mkDivider(),
      ], null, { padY: "0", isInner: true });
      return row;
    });

    return mkContainer([
      mkHeading(cat.label, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(8),
      mkDivider(brass),
      mkSpacer(24),
    ].concat(rows), null, { padY: "0", isInner: true });
  });

  var menuRow = mkContainer(menuSections, null, { direction: "row", gap: "48", padY: "0", isInner: true });
  menuRow.settings.flex_wrap = "wrap";
  var menuSection = mkContainer([
    mkHeading("The full menu", ink, "h2", { weight: 800, px: 44 }),
    mkSpacer(48),
    menuRow,
  ], bone, { padY: "80" });

  // How pricing works
  var pricingNote = mkContainer([
    mkHeading("How pricing works", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("Every price is a starting point. It scales with scope: more locations, more people, longer films, and more revision rounds. Most films come in good, better, and best versions, so a client can choose by budget without a negotiation. Rates rise with experience and reputation. Fair to start, and they climb as the work proves itself.", text),
  ], "#ffffff", { padY: "48", padX: "40" });
  pricingNote.settings.border_border = "solid";
  pricingNote.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"3", isLinked:false };
  pricingNote.settings.border_color = brass;

  var pricingNoteSection = mkContainer([pricingNote], bone, { padY: "48" });

  var closing = mkContainer([
    mkText("Not sure where to start? Tell me about the company.", stone, "center"),
    mkSpacer(24),
    mkButton("Start a project", brassDp, "#ffffff"),
  ], bone, { padY: "80", center: true });

  return { version: "0.4", title: "Services & Pricing", type: "page", page_settings: {},
    content: [header, tiersSection, menuSection, pricingNoteSection, closing] };
}

// Variant B — light background tiers with horizontal card layout
function buildServicesPageLight(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt || "#2B2823", text = C.text;

  var header = mkContainer([
    mkHeading(brief.servicesEyebrow || "Services & pricing", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.servicesH1 || "Every way to put your company on film.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(20),
    mkText("Real prices, in the open. Pick a package, or build a plan.", text),
  ], bone, { padY: "88" });

  var tiers = (brief.pricingTiers || [
    ["Front Door", "CASH FLOW & TRUST", "Productized story and testimonial packages with set scope and open pricing.", "From 2.5K per film"],
    ["Premium", "MARGIN & CRAFT", "Brand films, founder stories, and exit work. Built around your story and priced to the project.", "From 12K per film"],
    ["Partner Plan", "RECURRING", "An embedded video partner. Predictable monthly output, no constant re-quoting.", "From 4K per month"],
  ]).map(function(tier, i) {
    var featured = i === 1;
    var card = mkContainer([
      mkHeading(tier[1] || "", brassDp, "h6", { eyebrow: true }),
      mkSpacer(12),
      mkHeading(tier[0], featured ? warmWhite : ink, "h3", { weight: 700, px: 24 }),
      mkSpacer(16),
      mkDivider(featured ? "rgba(255,255,255,.2)" : "#E2DBCC"),
      mkSpacer(16),
      mkText(tier[2] || "", featured ? warmWhite : text),
      mkSpacer(20),
      mkHeading(tier[3] || "", featured ? brass : brassDp, "h4", { weight: 700, px: 28 }),
      mkSpacer(24),
      mkButton("Learn more", featured ? brassDp : "transparent", featured ? "#ffffff" : brassDp),
    ], featured ? asphalt : "#ffffff", { padY: "44", padX: "36", isInner: true });
    card.settings._flex_grow = 1;
    if (!featured) {
      card.settings.border_border = "solid";
      card.settings.border_width = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
      card.settings.border_color = "#E2DBCC";
    }
    return card;
  });

  var tiersRow = mkContainer(tiers, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  tiersRow.settings.flex_wrap = "wrap";
  var tiersSection = mkContainer([tiersRow], bone, { padY: "64" });

  var closing = mkContainer([
    mkText("Not sure where to start? Tell us about the company.", stone, "center"),
    mkSpacer(24),
    mkButton(brief.headerCta || "Start a project", brassDp, "#ffffff"),
  ], bone, { padY: "80", center: true });

  return { version: "0.4", title: "Services & Pricing", type: "page", page_settings: {},
    content: [header, tiersSection, closing] };
}

function buildAboutPage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt, text = C.text;

  var header = mkContainer([
    mkHeading(brief.aboutEyebrow || "About", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.aboutH1 || "One person. Every frame.", ink, "h1", { weight: 800, px: 64 }),
  ], bone, { padY: "88" });

  var closing = mkContainer([mkButton("Start a project", brassDp, "#ffffff")], bone, { padY: "80", center: true });

  // ── Variant A: Story + portrait split ─────────────────────────────────────
  var storyLeft = mkContainer([
    mkText(brief.aboutStory || "[Founder story — pulled from brief. Fill in if missing.]", text),
    mkSpacer(24),
    mkText(brief.aboutStory2 || "[Second paragraph — additional context about the founder's background and what led to this work.]", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var storyRight = mkContainer([
    mkImagePh("Founder portrait — on location, not in a studio."),
  ], null, { padY: "0", grow: 1, isInner: true });

  var storyRow = mkContainer([storyLeft, storyRight], null, { direction: "row", gap: "64", padY: "0", isInner: true });
  var storySection = mkContainer([storyRow], bone, { padY: "80" });

  var whySection = mkContainer([
    mkHeading(brief.whyEyebrow || "Why this approach", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.whyH2 || "One mind on the whole project.", ink, "h2", { weight: 800, px: 44 }),
    mkSpacer(24),
    mkText(brief.whyOneMaker || "[Why this approach — pulled from brief. Explain what makes the method different and why it matters to clients.]", text),
  ], "#ffffff", { padY: "80" });

  var values = (brief.founderValues || ["Grounded", "Forward", "Exact", "Singular", "Human"]).map(function(v) {
    var card = mkContainer([
      mkSpacer(8),
      mkHeading(v, ink, "h3", { weight: 700, px: 22 }),
    ], null, { padY: "32", isInner: true });
    card.settings.border_border = "solid";
    card.settings.border_width = { unit:"px", top:"0", right:"0", bottom:"0", left:"3", isLinked:false };
    card.settings.border_color = brass;
    card.settings.padding = { unit:"px", top:"16", right:"20", bottom:"16", left:"20", isLinked:false };
    card.settings._flex_grow = 1;
    return card;
  });
  var valuesRow = mkContainer(values, null, { direction: "row", gap: "16", padY: "0", isInner: true });
  valuesRow.settings.flex_wrap = "wrap";
  var valuesSection = mkContainer([
    mkHeading(brief.valuesEyebrow || "What we stand for", brassDp, "h6", { eyebrow: true }),
    mkSpacer(32),
    valuesRow,
  ], bone, { padY: "72" });

  var variantA = { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [header, storySection, whySection, valuesSection, closing] };

  // ── Variant B: Vertical milestone timeline ─────────────────────────────────
  var milestones = (brief.milestones || [
    ["The beginning", "How it started and what drove the decision to build this."],
    ["Finding the niche", "The moment the right clients and right work became clear."],
    ["The work that mattered", "The projects that defined the approach and proved the model."],
    ["Where it stands now", "What the studio is today and where it is headed."],
  ]);

  var timelineItems = milestones.map(function(m, i) {
    var isEven = i % 2 === 0;
    var dot = mkContainer([], brass, { padY: "0", isInner: true });
    dot.settings.width = { unit:"px", size: 12 };
    dot.settings.height = { unit:"px", size: 12 };
    dot.settings.border_radius = { unit:"%", top:"50", right:"50", bottom:"50", left:"50", isLinked:true };

    return mkContainer([
      mkContainer([dot], null, { padY: "0", isInner: true }),
      mkSpacer(20),
      mkHeading(m[0], ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(8),
      mkText(m[1], text),
    ], isEven ? bone : "#ffffff", { padY: "48", padX: "40", isInner: false });
  });

  var timeline = mkContainer(timelineItems, null, { gap: "0", padY: "0" });

  var portraitSection = mkContainer([
    mkContainer([
      mkImagePh("Founder portrait — on location."),
    ], null, { padY: "0", grow: 1, isInner: true }),
    mkContainer([
      mkHeading(brief.whyEyebrow || "Why this approach", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkText(brief.whyOneMaker || "[Why this approach — pulled from brief.]", text),
      mkSpacer(32),
      mkButton("Start a project", brassDp, "#ffffff"),
    ], null, { padY: "0", grow: 1, isInner: true }),
  ], bone, { direction: "row", gap: "64", padY: "80" });

  var variantB = { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [header, timeline, portraitSection, valuesSection, closing] };

  var aboutPattern = (patterns && patterns.about) || "split-image";
  var recommended = (aboutPattern === "timeline" || aboutPattern === "team-grid") ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

function buildProcessPage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;

  var header = mkContainer([
    mkHeading(brief.processEyebrow || "Process", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.processH1 || "How it gets made.", ink, "h1", { weight: 800, px: 64 }),
    mkSpacer(16),
    mkText(brief.processIntro || "Simple and calm, from first call to final files. No maze, no surprises.", text),
  ], bone, { padY: "88" });

  var defaultSteps = [
    ["01", "The intro", "A short call to understand the company and the goal. No charge, no maze."],
    ["02", "The plan", "A clear scope and a fixed quote up front. You know the price before anything starts."],
    ["03", "The work", "One focused engagement, lean and calm. No chaos, no surprises on your end."],
    ["04", "The review", "A first draft, then a set number of revision rounds. No open-ended feedback loops."],
    ["05", "Delivery", "Final files in every format you need, ready to use immediately."],
  ];
  var steps = brief.processSteps || defaultSteps;

  var callout = mkContainer([
    mkHeading(brief.calloutEyebrow || "What to expect", brass, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText(brief.calloutBody || "[What to expect — timeline and delivery details. Fill in from client brief.]", warmWhite),
  ], ink, { padY: "80" });

  var closing = mkContainer([mkButton("Start a project", brassDp, "#ffffff")], bone, { padY: "80", center: true });

  // ── Variant A: Two-column numbered grid ───────────────────────────────────
  var gridSteps = steps.map(function(step, i) {
    var num = step[0]; var title = step[1]; var body = step[2];
    return mkContainer([
      mkHeading(num, brass, "h1", { font: "Fraunces", weight: 300, px: 80 }),
      mkSpacer(24),
      mkDivider(brass),
      mkSpacer(24),
      mkHeading(title, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(12),
      mkText(body, text),
    ], i % 2 === 0 ? bone : "#ffffff", { padY: "56", padX: "40" });
  });

  var stepsRow1 = mkContainer(gridSteps.slice(0, 2), null, { direction: "row", gap: "0", padY: "0", isInner: true });
  var stepsRow2 = mkContainer(gridSteps.slice(2, 4), null, { direction: "row", gap: "0", padY: "0", isInner: true });
  var stepsRow3 = gridSteps.length > 4
    ? mkContainer([gridSteps[4]], null, { direction: "row", gap: "0", padY: "0", isInner: true })
    : null;
  var gridContent = stepsRow3
    ? mkContainer([stepsRow1, stepsRow2, stepsRow3], bone, { padY: "0", padX: "0", gap: "0" })
    : mkContainer([stepsRow1, stepsRow2], bone, { padY: "0", padX: "0", gap: "0" });

  var variantA = { version: "0.4", title: "Process", type: "page", page_settings: {},
    content: [header, gridContent, callout, closing] };

  // ── Variant B: Horizontal flowing timeline ────────────────────────────────
  var timelineSteps = steps.map(function(step) {
    var num = step[0]; var title = step[1]; var body = step[2];
    var card = mkContainer([
      mkHeading(num, brass, "h2", { font: "Fraunces", weight: 300, px: 56 }),
      mkSpacer(16),
      mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
      mkSpacer(8),
      mkText(body, text),
    ], "#ffffff", { padY: "40", padX: "32", isInner: true });
    card.settings.border_border = "solid";
    card.settings.border_width = { unit:"px", top:"3", right:"0", bottom:"0", left:"0", isLinked:false };
    card.settings.border_color = brass;
    card.settings._flex_grow = 1;
    return card;
  });
  var timelineRow = mkContainer(timelineSteps, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  timelineRow.settings.flex_wrap = "wrap";
  var timelineSection = mkContainer([timelineRow], bone, { padY: "80" });

  var variantB = { version: "0.4", title: "Process", type: "page", page_settings: {},
    content: [header, timelineSection, callout, closing] };

  var processPattern = (patterns && patterns.process) || "numbered-vertical";
  var recommended = (processPattern === "horizontal-timeline" || processPattern === "icon-cards") ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

function buildContactPage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;

  var formPlaceholder = mkContainer([
    mkText("Form fields: Name · Company · Email · What do you need? · Budget range (optional) · Message", stone),
    mkSpacer(8),
    mkText("<em>Connect a forms plugin (Fluent Forms or WPForms) and replace this with the live shortcode.</em>", stone),
  ], "#ffffff", { padY: "32", padX: "36" });
  formPlaceholder.settings.border_border = "solid";
  formPlaceholder.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  formPlaceholder.settings.border_color = "#E2DBCC";

  var closingDark = mkContainer([
    mkHeading(brief.tagline || "Ready to get started?", warmWhite, "h2",
      { font: "Fraunces", weight: 300, px: 52, italic: true, align: "center" }),
    mkSpacer(40),
    mkHeading(brief.signatureLine || "", stone, "h4", { align: "center" }),
  ], ink, { padY: "96", center: true });

  // ── Variant A: Stacked — header, form, reassurance, info split ────────────
  var headerA = mkContainer([
    mkHeading(brief.contactEyebrow || "Contact", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.contactH1 || "Tell us about your project.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(16),
    mkText(brief.contactIntro || "A quick note about what you need. You will get a real reply from a real person, usually within one business day.", text),
  ], bone, { padY: "88" });

  var formSectionA = mkContainer([
    formPlaceholder,
    mkSpacer(32),
    mkContainer([mkButton(brief.contactCta || "Send it over", brassDp, "#ffffff")], null, { padY: "0", isInner: true }),
    mkSpacer(24),
    mkText(brief.contactReassurance || "No sales team. No automated funnel. A real reply from a real person.", stone),
  ], bone, { padY: "64" });

  var infoLeft = mkContainer([
    mkHeading("What happens next", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("You send a note. Within one business day, you hear back from the person who actually does the work. No account manager, no intro call just to learn what you need.", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var infoRight = mkContainer([
    mkHeading("Not sure what you need?", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("Tell us what the company does and what you are trying to show. That is enough to start. The right approach will become clear in the first conversation.", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var infoRow = mkContainer([infoLeft, infoRight], null, { direction: "row", gap: "64", padY: "0", isInner: true });
  var infoSection = mkContainer([infoRow], bone, { padY: "72" });

  var variantA = { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [headerA, formSectionA, infoSection, closingDark] };

  // ── Variant B: Split — big statement left, lean form right ────────────────
  var statementLeft = mkContainer([
    mkHeading(brief.contactEyebrow || "Contact", brassDp, "h6", { eyebrow: true }),
    mkSpacer(24),
    mkHeading(brief.contactH1 || "Tell us about your project.", ink, "h2", { font: "Fraunces", weight: 300, px: 56 }),
    mkSpacer(32),
    mkText(brief.contactIntro || "A quick note about what you need. You will get a real reply from a real person, usually within one business day.", text),
    mkSpacer(32),
    mkText(brief.contactReassurance || "No sales team. No automated funnel. A real reply from a real person.", stone),
  ], null, { padY: "0", grow: 1, isInner: true });

  var formRight = mkContainer([
    formPlaceholder,
    mkSpacer(24),
    mkButton(brief.contactCta || "Send it over", brassDp, "#ffffff"),
  ], null, { padY: "0", grow: 1, isInner: true });

  var splitRow = mkContainer([statementLeft, formRight], null, { direction: "row", gap: "80", padY: "0", isInner: true });
  var splitSection = mkContainer([splitRow], bone, { padY: "96" });

  var variantB = { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [splitSection, closingDark] };

  var contactPattern = (patterns && patterns.contact) || "split-form";
  var recommended = (contactPattern === "split-form") ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

// ─── Inspo pattern merger ─────────────────────────────────────────────────────
// Distills all crawl results into a per-page-type hint object.
// Each key is a page type; value is a merged string of structural notes from
// every URL that had that page type. Gets passed into page builders so they
// can make layout decisions informed by real reference sites.
function buildInspoContext(crawlResults, storedPatterns) {
  // Single shared pool — all patterns from all pages merged together.
  // Nothing is routed by page type. Every builder draws from the full pool.
  var allNotes = [];

  // Stored patterns from previous sessions
  if (storedPatterns) {
    Object.keys(storedPatterns).forEach(function(key) {
      if (storedPatterns[key]) allNotes.push(storedPatterns[key]);
    });
  }

  // Current session crawl results — all pages, all sites
  Object.keys(crawlResults).forEach(function(url) {
    var result = crawlResults[url];
    if (!result || result.error || !result.patterns) return;
    if (result.patterns.siteNotes) allNotes.push(result.patterns.siteNotes);
    var pages = result.patterns.pages || {};
    Object.keys(pages).forEach(function(pageType) {
      if (pages[pageType]) allNotes.push("[" + pageType + "] " + pages[pageType]);
    });
  });

  return allNotes.join(" | ");
}

function buildGenericPage(colors, brief, pageDef, inspoContext, variant) {
  var ink = colors.ink || "#1C1A17";
  var bone = colors.bone || "#EDE7DB";
  var brass = colors.brass || "#C2A35B";
  var brassDp = colors["brass-deep"] || "#9C7E3A";
  var warmWhite = colors["warm-white"] || "#FBFAF7";
  var text = colors.text || "#2A2722";
  var stone = colors.stone || "#8A8170";
  var asphalt = colors.asphalt || "#2B2823";
  var label = pageDef.label;
  var pid = pageDef.id;
  var isDark = (variant === "B");

  // Hero — Variant A: light bone bg, Variant B: dark ink bg
  var heroEyebrow = mkHeading(brief.brandName || "", isDark ? brass : brass, "h6", { eyebrow: true, align: isDark ? "left" : "left" });
  var heroH1 = mkHeading(label, isDark ? warmWhite : ink, "h1", { font: (brief.fonts && brief.fonts[1]) || "Inter", weight: 800, px: 52 });
  var heroContainer = mkContainer([heroEyebrow, mkSpacer(16), heroH1], isDark ? ink : bone, { padY: "80", minH: 50, center: true });

  // Page-type specific sections
  var sections = [];
  sections.push(heroContainer);

  // Page-specific content
  if (pid === "team") {
    sections.push(mkContainer([
      mkHeading("The team.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("The people behind the work.", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "blog" || pid === "blog-post") {
    sections.push(mkContainer([
      mkHeading(pid === "blog" ? "Journal." : "[Post title]", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText(pid === "blog" ? "Thinking, writing, and updates from the studio." : "[Post content — add in WordPress editor]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "faq") {
    sections.push(mkContainer([
      mkHeading("Questions, answered.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add your FAQ items in Elementor after import]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "testimonials") {
    sections.push(mkContainer([
      mkHeading("Kind words.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add testimonials in Elementor after import]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "careers") {
    sections.push(mkContainer([
      mkHeading("Work with us.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add open roles and career information here]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "press") {
    sections.push(mkContainer([
      mkHeading("Press & media.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add press mentions, media kit, and brand assets here]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "pricing") {
    sections.push(mkContainer([
      mkHeading("Investment.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("Transparent pricing. No surprises.", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "landing") {
    sections.push(mkContainer([
      mkHeading(brief.tagline || "[Landing page headline]", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText(brief.hookStatement || "[Landing page subheadline — specific and direct]", stone),
      mkSpacer(24),
      mkButton(brief.heroCta1 || "Get started", brassDp, "#ffffff"),
    ], bone, { padY: "80", center: true }));
  } else if (pid === "thank-you") {
    sections.push(mkContainer([
      mkHeading("You're all set.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("We'll be in touch shortly.", stone),
    ], bone, { padY: "80", center: true }));
  } else if (pid === "privacy" || pid === "terms") {
    sections.push(mkContainer([
      mkHeading(pid === "privacy" ? "Privacy Policy" : "Terms of Service", text, "h2", { weight: 700, px: 32 }),
      mkSpacer(16),
      mkText("[Add your " + (pid === "privacy" ? "privacy policy" : "terms of service") + " content here — consult a legal professional]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "404") {
    sections.push(mkContainer([
      mkHeading("404", brass, "h1", { weight: 800, px: 80 }),
      mkSpacer(8),
      mkHeading("Page not found.", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(16),
      mkText("The page you're looking for doesn't exist or has moved.", stone),
      mkSpacer(24),
      mkButton("Go home", brassDp, "#ffffff"),
    ], bone, { padY: "80", center: true }));
  } else {
    // Generic fallback
    sections.push(mkContainer([
      mkHeading(label + ".", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add content for this page in Elementor after import]", stone),
    ], bone, { padY: "80" }));
  }

  // Closing CTA
  sections.push(mkContainer([
    mkHeading(brief.tagline || brief.closingCta || "Ready to get started?", warmWhite, "h2", { font: (brief.fonts && brief.fonts[1]) || "Inter", weight: 400, px: 40 }),
    mkSpacer(24),
    mkButton(brief.headerCta || "Start a project", brassDp, "#ffffff"),
  ], asphalt, { padY: "80", center: true }));

  return { version: "0.4", title: (brief.brandName || "Site") + " — " + label, type: "page", page_settings: {}, content: sections };
}

function generatePages(brief, selectedPages, inspoContext, aiRecs, customPagesArg) {
  var colors = brief.colors || {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  var recs = aiRecs || {};
  var allPageDefs = ALL_PAGES.concat(ADDITIONAL_PAGE_TYPES).concat(customPagesArg || []);
  var patterns = selectPatterns(brief, inspoContext || "");

  return selectedPages.map(function(pid) {
    var pageDef = allPageDefs.find(function(p) { return p.id === pid; }) || { id: pid, label: pid.replace(/-\d+$/, "").replace(/(^|-)(.)/g, function(_, s, c) { return (s ? " " : "") + c.toUpperCase(); }), slug: "/" + pid.replace(/-\d+$/, "") };
    var label = pageDef.label;
    var result = null;

    if (pid === "home") {
      var homePatterns = Object.assign({}, patterns);
      homePatterns.hero = "centered-bold";
      var homeA = buildHomePage(colors, brief, inspoContext, homePatterns);
      var homePatternsB = Object.assign({}, patterns);
      homePatternsB.hero = "split-left";
      var homeB = buildHomePage(colors, brief, inspoContext, homePatternsB);
      var homeRec = (patterns.hero === "split-left" || patterns.hero === "split-right") ? "B" : "A";
      var homeData = homeRec === "B" ? homeB : homeA;
      return { id: pid, label: label, data: homeData, variantA: homeA, variantB: homeB, recommended: homeRec, hasVariants: true };
    }
    if (pid === "services") {
      var svcA = buildServicesPage(colors, brief, inspoContext);
      var svcB = buildServicesPageLight(colors, brief, inspoContext);
      var svcRec = (patterns.pricing === "simple-list" || patterns.pricing === "two-tier") ? "B" : "A";
      return { id: pid, label: label, data: svcRec === "B" ? svcB : svcA, variantA: svcA, variantB: svcB, recommended: svcRec, hasVariants: true };
    }
    if (pid === "work")    result = buildWorkPage(colors, brief, inspoContext);
    if (pid === "about")   result = buildAboutPage(colors, brief, inspoContext, patterns);
    if (pid === "process") result = buildProcessPage(colors, brief, inspoContext, patterns);
    if (pid === "contact") result = buildContactPage(colors, brief, inspoContext, patterns);

    // Additional and custom page types
    if (!result) {
      // Utility pages — no meaningful A/B variation
      var utilityPages = ["thank-you", "privacy", "terms", "404"];
      if (utilityPages.includes(pid)) {
        var gd = buildGenericPage(colors, brief, pageDef, inspoContext, "A");
        return { id: pid, label: label, data: gd, variantA: gd, variantB: null, recommended: "A", hasVariants: false };
      }
      // Standalone pricing page — reuse services builders
      if (pid === "pricing") {
        var pA = buildServicesPage(colors, brief, inspoContext);
        var pB = buildServicesPageLight(colors, brief, inspoContext);
        var pRec = (patterns.pricing === "simple-list" || patterns.pricing === "two-tier") ? "B" : "A";
        return { id: pid, label: label, data: pRec === "B" ? pB : pA, variantA: pA, variantB: pB, recommended: pRec, hasVariants: true };
      }
      // Standalone portfolio page — reuse work builders
      if (pid === "portfolio") {
        var portResult = buildWorkPage(colors, brief, inspoContext);
        var portRec = portResult.recommended || "A";
        return { id: pid, label: label, data: portRec === "B" ? portResult.variantB : portResult.variantA, variantA: portResult.variantA, variantB: portResult.variantB, recommended: portRec, hasVariants: true };
      }
      // All other pattern-driven pages — A = light hero, B = dark hero
      var gA = buildGenericPage(colors, brief, pageDef, inspoContext, "A");
      var gB = buildGenericPage(colors, brief, pageDef, inspoContext, "B");
      return { id: pid, label: label, data: gA, variantA: gA, variantB: gB, recommended: "A", hasVariants: true };
    }

    var recommended = (recs[pid] && recs[pid].variant) ? recs[pid].variant : result.recommended;

    return {
      id: pid,
      label: label,
      data: recommended === "B" ? result.variantB : result.variantA,
      variantA: result.variantA,
      variantB: result.variantB,
      recommended: recommended,
      hasVariants: true,
    };
  }).filter(function(p) { return p !== null; });
}

// ─── HTML Preview ─────────────────────────────────────────────────────────────

// ── LAYOUT PATTERNS ── Multiple visual structures per section type.
// Inspo analysis + brief data selects the pattern. Different inputs = different outputs.
const LAYOUT_PATTERNS = {
  hero: [
    { id: "split-left", label: "Split — text left, image right", industries: ["agency", "saas", "consulting"] },
    { id: "split-right", label: "Split — image left, text right", industries: ["creative", "photography", "design"] },
    { id: "centered-bold", label: "Centered headline, no image", industries: ["law", "finance", "enterprise"] },
    { id: "full-image", label: "Full image background with overlay", industries: ["hospitality", "events", "real-estate"] },
    { id: "minimal", label: "Minimal text, large whitespace", industries: ["studio", "architecture", "luxury"] },
  ],
  services: [
    { id: "card-grid", label: "3-column card grid", industries: ["saas", "consulting", "agency"] },
    { id: "alternating-rows", label: "Alternating image-text rows", industries: ["creative", "photography", "design"] },
    { id: "icon-list", label: "Icon + text list", industries: ["law", "finance", "healthcare"] },
    { id: "numbered-features", label: "Numbered feature blocks", industries: ["saas", "tech", "startup"] },
  ],
  about: [
    { id: "split-image", label: "Image left, text right", industries: ["agency", "studio", "consulting"] },
    { id: "centered-narrative", label: "Centered long-form story", industries: ["founder", "personal-brand"] },
    { id: "team-grid", label: "Team grid with bios", industries: ["law", "agency", "enterprise"] },
    { id: "timeline", label: "Company timeline", industries: ["enterprise", "manufacturing", "established"] },
  ],
  testimonials: [
    { id: "card-grid", label: "3-column quote cards", industries: ["agency", "saas", "consulting"] },
    { id: "single-large", label: "One large centered quote", industries: ["luxury", "studio", "architecture"] },
    { id: "alternating", label: "Alternating left-right quotes", industries: ["creative", "personal-brand"] },
  ],
  cta: [
    { id: "dark-full", label: "Dark full-width with heading", industries: ["all"] },
    { id: "split-cta", label: "Text left, button right", industries: ["saas", "consulting"] },
    { id: "minimal-line", label: "Single line with button", industries: ["studio", "luxury", "minimal"] },
  ],
  portfolio: [
    { id: "masonry-grid", label: "Masonry image grid", industries: ["photography", "design", "creative"] },
    { id: "case-study-cards", label: "Case study cards with text", industries: ["agency", "consulting", "law"] },
    { id: "full-width-stacked", label: "Full-width stacked projects", industries: ["architecture", "studio"] },
  ],
  process: [
    { id: "numbered-vertical", label: "Numbered vertical steps", industries: ["agency", "consulting", "services"] },
    { id: "horizontal-timeline", label: "Horizontal timeline", industries: ["enterprise", "manufacturing"] },
    { id: "icon-cards", label: "Icon cards grid", industries: ["saas", "tech", "startup"] },
  ],
  contact: [
    { id: "split-form", label: "Info left, form right", industries: ["agency", "consulting", "services"] },
    { id: "centered-minimal", label: "Centered minimal form", industries: ["studio", "luxury", "minimal"] },
    { id: "full-details", label: "Full details with map placeholder", industries: ["local", "real-estate", "hospitality"] },
  ],
  pricing: [
    { id: "three-tier", label: "3-column pricing cards", industries: ["saas", "agency", "services"] },
    { id: "two-tier", label: "2-column with feature list", industries: ["consulting", "studio"] },
    { id: "simple-list", label: "Simple price list", industries: ["creative", "photography", "freelance"] },
  ],
  blog: [
    { id: "grid-3col", label: "3-column article grid", industries: ["agency", "saas", "media"] },
    { id: "featured-plus-grid", label: "Featured post + grid", industries: ["creative", "editorial"] },
    { id: "list-view", label: "List with thumbnails", industries: ["law", "consulting", "finance"] },
  ],
  faq: [
    { id: "accordion", label: "Expandable accordion", industries: ["saas", "services", "agency"] },
    { id: "two-column", label: "Two-column Q&A", industries: ["enterprise", "consulting"] },
    { id: "categorized", label: "Categorized sections", industries: ["saas", "complex"] },
  ],
  landing: [
    { id: "centered-dark", label: "Dark centered hero + numbered benefits", industries: ["saas", "startup", "agency"] },
    { id: "split-light", label: "Light split hero + alternating benefits", industries: ["consulting", "services", "creative"] },
    { id: "social-proof", label: "Light hero + logo strip + feature cards", industries: ["saas", "enterprise", "b2b"] },
  ],
  team: [
    { id: "photo-grid", label: "Equal photo grid with name and role", industries: ["agency", "consulting", "law"] },
    { id: "featured-founder", label: "Featured founder large + supporting team", industries: ["founder", "studio", "startup"] },
    { id: "horizontal-list", label: "Horizontal list with bio text", industries: ["enterprise", "finance", "healthcare"] },
  ],
  testimonials: [
    { id: "card-grid", label: "3-column quote cards", industries: ["agency", "saas", "consulting"] },
    { id: "single-feature", label: "Single large dark feature quote", industries: ["luxury", "studio", "architecture"] },
    { id: "alternating-quotes", label: "Alternating left-right with avatar", industries: ["creative", "personal-brand", "services"] },
  ],
  events: [
    { id: "date-list", label: "Date-anchored list with register button", industries: ["all"] },
    { id: "event-cards", label: "Card grid with image and date badge", industries: ["hospitality", "creative", "entertainment"] },
    { id: "featured-next", label: "Featured next event hero + list", industries: ["enterprise", "conference", "education"] },
  ],
  careers: [
    { id: "job-list", label: "Clean job list with apply buttons", industries: ["all"] },
    { id: "values-first", label: "Culture and values section + job list", industries: ["startup", "agency", "creative"] },
    { id: "split-layout", label: "Culture copy left, open roles right", industries: ["enterprise", "saas", "consulting"] },
  ],
  "case-study": [
    { id: "dark-hero-metrics", label: "Dark hero + challenge/solution/result", industries: ["agency", "consulting", "creative"] },
    { id: "editorial-light", label: "Light editorial with large image and pull quote", industries: ["design", "photography", "brand"] },
    { id: "numbers-first", label: "Big stat numbers lead + narrative", industries: ["saas", "enterprise", "b2b"] },
  ],
};

// Parse inspo crawl text and return a boost map: { patternId: boostScore }
function parseInspoPatterns(inspoContext) {
  if (!inspoContext) return {};
  var text = inspoContext.toLowerCase();
  var boosts = {};
  function bump(id, amt) { boosts[id] = (boosts[id] || 0) + (amt || 8); }

  // Hero
  if (text.match(/split.{0,20}(hero|left|right)|image.{0,10}(left|right).{0,20}text/)) { bump("split-left"); bump("split-right"); }
  if (text.match(/centered.{0,20}(headline|hero|title)|full.?width.{0,20}(text|headline)/)) bump("centered-bold");
  if (text.match(/full.?(image|bleed|background)|hero.{0,20}(background|photo|image)/)) bump("full-image");
  if (text.match(/minimal|large.{0,20}whitespace|clean.{0,20}layout/)) bump("minimal");

  // Services
  if (text.match(/card.{0,10}grid|grid.{0,10}card|three.?column|3.?col/)) bump("card-grid");
  if (text.match(/alternating.?(row|image|text)|image.?text.?row/)) { bump("alternating-rows"); bump("alternating"); }
  if (text.match(/numbered.{0,20}(feature|step|block)/)) { bump("numbered-features"); bump("numbered-vertical"); }
  if (text.match(/icon.{0,10}(list|card|grid)/)) { bump("icon-list"); bump("icon-cards"); }

  // About
  if (text.match(/split.{0,10}image|image.{0,10}(left|right).{0,20}(text|copy)/)) bump("split-image");
  if (text.match(/long.?form|narrative|centered.{0,20}(story|text)/)) bump("centered-narrative");
  if (text.match(/team.{0,10}grid|team.{0,10}photo|headshot|staff.{0,10}photo/)) bump("team-grid");
  if (text.match(/timeline|company.{0,10}history|mileston/)) { bump("timeline"); bump("horizontal-timeline"); }

  // Testimonials
  if (text.match(/large.{0,10}quote|single.{0,10}(quote|testimonial)|featured.{0,10}quote/)) bump("single-large");
  if (text.match(/alternating.{0,10}(quote|testimonial)/)) bump("alternating");

  // CTA
  if (text.match(/dark.{0,20}(cta|section|band)|cta.{0,20}dark/)) bump("dark-full");
  if (text.match(/split.{0,10}(cta|call.to.action)|text.{0,10}left.{0,10}button/)) bump("split-cta");
  if (text.match(/minimal.{0,10}(cta|call)|single.?line.{0,10}(cta|button)/)) bump("minimal-line");

  // Portfolio
  if (text.match(/masonry|pinterest.?style/)) bump("masonry-grid");
  if (text.match(/case.?study.{0,10}card|project.{0,10}card/)) bump("case-study-cards");
  if (text.match(/full.?width.{0,20}(project|work|portfolio)|stacked.{0,10}(project|work)/)) bump("full-width-stacked");

  // Process
  if (text.match(/horizontal.{0,10}timeline|step.{0,20}horizontal/)) bump("horizontal-timeline");

  // Contact
  if (text.match(/split.{0,10}(form|contact)|form.{0,10}right|info.{0,10}left/)) bump("split-form");
  if (text.match(/centered.{0,10}form|minimal.{0,10}(form|contact)/)) bump("centered-minimal");
  if (text.match(/\bmap\b|location.{0,10}detail|address.{0,20}detail/)) bump("full-details");

  // Pricing
  if (text.match(/three.?tier|3.?tier|three.?column.{0,20}pric/)) bump("three-tier");
  if (text.match(/two.?tier|2.?tier|two.?column.{0,20}pric/)) bump("two-tier");
  if (text.match(/price.{0,10}list|simple.{0,10}pric/)) bump("simple-list");

  // Blog
  if (text.match(/featured.{0,10}(post|article)|hero.{0,10}(post|article)/)) bump("featured-plus-grid");
  if (text.match(/article.{0,10}list|list.{0,10}(view|layout)/)) bump("list-view");

  // FAQ
  if (text.match(/accordion|expandable|collaps/)) bump("accordion");
  if (text.match(/two.?column.{0,10}(faq|q.?a)/)) bump("two-column");
  if (text.match(/categori.{0,10}(faq|question)|grouped.{0,10}faq/)) bump("categorized");

  return boosts;
}

// Select patterns based on brief + inspo, ensuring variety between generations
function selectPatterns(brief, inspoContext) {
  // Create a seed from the brief content so same brief = same patterns, but different brief = different patterns
  var seed = 0;
  var seedStr = (brief.brandName || "") + (brief.industry || "") + (brief.heroHeadline || "") + (inspoContext || "");
  for (var i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
  seed = Math.abs(seed);

  var result = {};
  var industry = (brief.industry || brief.niche || "general").toLowerCase();
  var inspoBoosts = parseInspoPatterns(inspoContext);

  Object.keys(LAYOUT_PATTERNS).forEach(function(sectionType) {
    var options = LAYOUT_PATTERNS[sectionType];
    // Score each pattern: industry match + inspo keyword boost + seed-based variety
    var scored = options.map(function(p, idx) {
      var score = 0;
      if (p.industries.includes("all")) score += 5;
      p.industries.forEach(function(ind) {
        if (industry.indexOf(ind) !== -1) score += 10;
      });
      // Inspo boost — crawled site structure nudges toward matching patterns
      if (inspoBoosts[p.id]) score += inspoBoosts[p.id];
      // Seed-based variety so different briefs pick different patterns even with same industry
      score += ((seed + idx * 7) % 5);
      return { pattern: p, score: score, idx: idx };
    });
    scored.sort(function(a, b) { return b.score - a.score || ((seed % 3) - 1); });
    result[sectionType] = scored[0].pattern.id;
  });

  return result;
}

// Escape HTML special characters — prevents XSS when inserting user input into preview HTML strings
function he(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function buildPreviewHTML(brief, activePage, variant, inspoContext) {
  variant = variant || "A";

  // Sanitize all string fields up-front so every downstream insertion is XSS-safe
  var safe = {};
  Object.keys(brief || {}).forEach(function(k) {
    var v = (brief || {})[k];
    safe[k] = typeof v === "string" ? he(v) : v;
  });
  brief = safe;

  var patterns = selectPatterns(brief, inspoContext || "");

  // Apply A/B variant overrides so the toggle actually changes the preview
  if (activePage === "services") {
    patterns.services = (variant === "B") ? "alternating-rows" : "card-grid";
  }
  if (activePage === "home") {
    patterns.hero = (variant === "B") ? "split-left" : "centered-bold";
  }
  if (activePage === "about") {
    patterns.about = (variant === "B") ? "team-grid" : "split-image";
  }
  if (activePage === "process") {
    patterns.process = (variant === "B") ? "horizontal-timeline" : "numbered-vertical";
  }
  if (activePage === "contact") {
    patterns.contact = (variant === "B") ? "split-form" : "centered-minimal";
  }
  if (activePage === "work") {
    patterns.portfolio = (variant === "B") ? "case-study-cards" : "masonry-grid";
  }
  if (activePage === "landing") {
    patterns.landing = (variant === "B") ? "split-light" : "centered-dark";
  }
  if (activePage === "team") {
    patterns.team = (variant === "B") ? "featured-founder" : "photo-grid";
  }
  if (activePage === "blog") {
    patterns.blog = (variant === "B") ? "featured-plus-grid" : "grid-3col";
  }
  if (activePage === "testimonials") {
    patterns.testimonials = (variant === "B") ? "single-feature" : "card-grid";
  }
  if (activePage === "events") {
    patterns.events = (variant === "B") ? "event-cards" : "date-list";
  }
  if (activePage === "careers") {
    patterns.careers = (variant === "B") ? "values-first" : "job-list";
  }
  if (activePage === "case-study") {
    patterns["case-study"] = (variant === "B") ? "editorial-light" : "dark-hero-metrics";
  }
  if (activePage === "faq") {
    patterns.faq = (variant === "B") ? "two-column" : "accordion";
  }
  if (activePage === "pricing") {
    patterns.pricing = (variant === "B") ? "two-tier" : "three-tier";
  }
  if (activePage === "portfolio") {
    patterns.portfolio = (variant === "B") ? "editorial" : "dark-grid";
  }
  if (activePage === "location") {
    patterns.location = (variant === "B") ? "centered" : "map-split";
  }
  if (activePage === "press") {
    patterns.press = (variant === "B") ? "featured-hero" : "list";
  }
  if (activePage === "partners") {
    patterns.partners = (variant === "B") ? "description-list" : "logo-grid";
  }
  if (activePage === "resources") {
    patterns.resources = (variant === "B") ? "category-list" : "card-grid";
  }
  if (activePage === "downloads") {
    patterns.downloads = (variant === "B") ? "card-grid" : "simple-list";
  }
  if (activePage === "blog-post") {
    patterns["blog-post"] = (variant === "B") ? "wide-editorial" : "narrow-centered";
  }
  if (activePage === "event-single") {
    patterns["event-single"] = (variant === "B") ? "light-centered" : "dark-hero";
  }
  var C = brief.colors || {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt || "#2B2823",
      text = C.text || "#2A2722";
  var fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap";

  var sections = {
    home: (function() {
      var hp = patterns.hero;
      
      // ── HERO VARIANTS ──
      var heroHTML = "";
      if (hp === "split-right") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + (brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "centered-bold") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(80px,12vw,140px) clamp(24px,8vw,80px);text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>" + (brief.brandName || "Brand") + "</div>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,72px);color:" + warmWhite + ";margin:0 0 24px;line-height:1.05;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;margin:0 auto 40px;line-height:1.7;max-width:560px;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<div style='display:flex;gap:12px;justify-content:center;flex-wrap:wrap;'>" +
              "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
              "<a style='padding:14px 40px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + (brief.heroCta2 || "Learn more") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "full-image") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(100px,15vw,180px) clamp(24px,8vw,80px);text-align:center;position:relative;'>" +
          "<div style='position:absolute;inset:0;background:#e0ddd7;opacity:0.3;'></div>" +
          "<div style='position:relative;max-width:700px;margin:0 auto;'>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,64px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.08;text-shadow:0 2px 20px rgba(0,0,0,0.3);'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";margin:0 0 36px;line-height:1.7;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>";
      } else if (hp === "minimal") {
        heroHTML = "<section style='background:" + bone + ";padding:clamp(100px,15vw,200px) clamp(24px,8vw,80px);'>" +
          "<div style='max-width:800px;'>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(40px,7vw,80px);color:" + ink + ";margin:0 0 24px;line-height:1.05;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + stone + ";margin:0 0 40px;line-height:1.7;max-width:480px;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<a style='padding:14px 32px;background:" + ink + ";color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:0;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>";
      } else { // split-left (default)
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + (brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;max-width:480px;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<div style='display:flex;gap:12px;flex-wrap:wrap;'>" +
                "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
                "<a style='padding:14px 32px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + (brief.heroCta2 || "Learn more") + "</a>" +
              "</div>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
          "</div>" +
        "</section>";
      }
      
      // ── SERVICES VARIANTS ──
      var sp = patterns.services;
      var svcCards = (brief.serviceCards || [["Service One","Description of what this service provides."],["Service Two","Description of what this service provides."],["Service Three","Description of what this service provides."]]);
      var servicesHTML = "";
      if (sp === "alternating-rows") {
        servicesHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 48px;'>" + (brief.servicesHeading || "Our services") + "</h2>" +
          svcCards.map(function(pair, idx) {
            var imgFirst = idx % 2 === 0;
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:48px;'>" +
              (imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Image</div>" : "") +
              "<div><h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:16px;color:" + stone + ";line-height:1.7;margin:0;'>" + pair[1] + "</p></div>" +
              (!imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Image</div>" : "") +
            "</div>";
          }).join("") +
        "</div></section>";
      } else if (sp === "numbered-features") {
        servicesHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);'><div style='max-width:900px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 48px;'>" + (brief.servicesHeading || "Our services") + "</h2>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else { // card-grid
        servicesHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 40px;'>" + (brief.servicesHeading || "Our services") + "</h2>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            svcCards.map(function(pair) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'><div style='width:40px;height:3px;background:" + brass + ";margin-bottom:20px;'></div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div>";
            }).join("") +
          "</div>" +
        "</div></section>";
      }

      // ── ABOUT VARIANTS ──
      var ap = patterns.about;
      var aboutHTML = "";
      if (ap === "centered-narrative") {
        aboutHTML = "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);'><div style='max-width:720px;margin:0 auto;text-align:center;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 24px;line-height:1.15;'>" + (brief.aboutHeading || "Our story") + "</h2>" +
          "<p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0;text-align:left;'>" + (brief.aboutBody || "Your company story goes here.") + "</p>" +
        "</div></section>";
      } else { // split-image
        aboutHTML = "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>About image</div>" +
          "<div>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
            "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 16px;line-height:1.15;'>" + (brief.aboutHeading || "About the company") + "</h2>" +
            "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0;'>" + (brief.aboutBody || "Your company story goes here.") + "</p>" +
          "</div>" +
        "</div></section>";
      }

      // ── TESTIMONIALS ──
      var tp = patterns.testimonials;
      var testimonialsHTML = "";
      if (tp === "single-large") {
        testimonialsHTML = "<section style='background:" + bone + ";padding:100px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:32px;'>Kind words</div>" +
          "<p style='font-size:clamp(20px,3vw,28px);color:" + ink + ";line-height:1.5;font-style:italic;margin:0 0 24px;'>This changed everything for our business. The quality of work exceeded every expectation.</p>" +
          "<div style='font-size:14px;font-weight:600;color:" + ink + ";'>Client Name</div><div style='font-size:13px;color:" + stone + ";'>CEO, Company</div>" +
        "</div></section>";
      } else { // card-grid
        testimonialsHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Kind words</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 40px;'>What our clients say</h2>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            ["This changed everything for our business.", "Professional and genuinely cared about the outcome.", "We saw results within the first month."].map(function(q) {
              return "<div style='background:#ffffff;border-left:3px solid " + brass + ";padding:28px;'><p style='font-size:17px;color:" + ink + ";line-height:1.5;margin:0 0 16px;font-style:italic;'>" + q + "</p><div style='font-size:14px;font-weight:600;color:" + ink + ";'>Client Name</div><div style='font-size:13px;color:" + stone + ";'>Role, Company</div></div>";
            }).join("") +
          "</div>" +
        "</div></section>";
      }

      // ── CTA VARIANTS ──
      var cp = patterns.cta;
      var ctaHTML = "";
      if (cp === "split-cta") {
        ctaHTML = "<section style='background:" + ink + ";padding:60px clamp(24px,8vw,80px);'><div style='display:flex;justify-content:space-between;align-items:center;max-width:1160px;margin:0 auto;flex-wrap:wrap;gap:24px;'>" +
          "<h2 style='font-weight:800;font-size:clamp(20px,3vw,32px);color:" + warmWhite + ";margin:0;'>" + (brief.tagline || "Ready to get started?") + "</h2>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Start a project</a>" +
        "</div></section>";
      } else if (cp === "minimal-line") {
        ctaHTML = "<section style='background:" + bone + ";padding:60px clamp(24px,8vw,80px);text-align:center;border-top:1px solid #E2DBCC;'>" +
          "<a style='font-size:16px;color:" + brassDp + ";text-decoration:underline;font-weight:600;'>" + (brief.heroCta1 || "Start a project") + " →</a>" +
        "</section>";
      } else { // dark-full
        ctaHTML = "<section style='background:" + ink + ";padding:80px clamp(24px,8vw,80px);text-align:center;'>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,4vw,44px);color:" + warmWhite + ";margin:0 0 12px;'>" + (brief.tagline || "Ready to get started?") + "</h2>" +
          "<p style='font-size:14px;color:" + stone + ";letter-spacing:2px;text-transform:uppercase;margin:0 0 32px;'>" + (brief.signatureLine || "") + "</p>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Start a project</a>" +
        "</section>";
      }

      // ── HOOK ──
      var hookHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 16px;line-height:1.15;'>" + (brief.hookStatement || "The problem you solve, stated clearly.") + "</h2>" +
        "<p style='font-size:17px;color:" + text + ";line-height:1.7;margin:0;'>" + (brief.hookBody || "") + "</p>" +
      "</div></section>";

      // ── PRICING TEASER ──
      var pricingHTML = "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 16px;'>Clear pricing. No surprises.</h2>" +
        "<p style='font-size:17px;color:" + text + ";line-height:1.7;margin:0 0 32px;'>See what it costs before you book a call.</p>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>See pricing</a>" +
      "</div></section>";

      return heroHTML + hookHTML + servicesHTML + aboutHTML + testimonialsHTML + pricingHTML + ctaHTML;
    })(),

    work: (function() {
      var wp = patterns.portfolio || "masonry-grid";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Work</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Selected projects</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>A look at what we have built.</p>" +
      "</div></section>";
      var body = "";
      if (wp === "case-study-cards") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          [1,2,3,4].map(function(n) {
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-bottom:40px;background:#fff;border:1px solid #E2DBCC;border-radius:4px;overflow:hidden;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
              "<div style='padding:32px;'><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>Category</div>" +
              "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>Project Title " + n + "</h3>" +
              "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Brief description of this project and the results achieved.</p></div></div>";
          }).join("") + "</div></section>";
      } else if (wp === "full-width-stacked") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          [1,2,3].map(function(n) {
            return "<div style='margin-bottom:48px;'><div style='background:#e0ddd7;aspect-ratio:21/9;display:flex;align-items:center;justify-content:center;color:" + stone + ";margin-bottom:20px;border-radius:4px;'>Project " + n + " — full width image</div>" +
              "<div style='display:flex;justify-content:space-between;align-items:baseline;'>" +
              "<h3 style='font-size:20px;font-weight:700;color:" + ink + ";margin:0;'>Project Title " + n + "</h3>" +
              "<span style='font-size:13px;color:" + stone + ";'>Category · Year</span></div></div>";
          }).join("") + "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
          [1,2,3,4,5,6].map(function(n) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:" + (n % 2 === 0 ? "4/3" : "3/4") + ";display:flex;align-items:center;justify-content:center;color:" + stone + ";border-radius:4px;margin-bottom:12px;'>Project " + n + "</div>" +
              "<div style='font-size:15px;font-weight:600;color:" + ink + ";'>Project Title " + n + "</div>" +
              "<div style='font-size:13px;color:" + stone + ";'>Category</div></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
    })(),

    services: (function() {
      var sp = patterns.services;
      var svcCards = brief.serviceCards || [["Service One","Description goes here."],["Service Two","Description goes here."],["Service Three","Description goes here."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'>" +
        "<div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Services</div>" +
          "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.servicesH1 || "What we offer") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>" + (brief.servicesSubhead || "Our full range of services.") + "</p>" +
        "</div></section>";
      var body = "";
      if (sp === "alternating-rows") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            var imgFirst = idx % 2 === 0;
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:48px;'>" +
              (imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" : "") +
              "<div><h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:16px;color:" + stone + ";line-height:1.7;margin:0;'>" + pair[1] + "</p></div>" +
              (!imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" : "") +
            "</div>";
          }).join("") + "</div></section>";
      } else if (sp === "numbered-features") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div></div>";
          }).join("") + "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          svcCards.map(function(pair) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'><div style='width:40px;height:3px;background:" + brass + ";margin-bottom:20px;'></div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
    })(),
    about: (function() {
      var ap = patterns.about;
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.aboutHeading || "Our story") + "</h1>" +
      "</div></section>";
      var body = "";
      if (ap === "centered-narrative") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.8;margin:0 0 32px;'>" + (brief.aboutBody || "Your company story goes here.") + "</p>" +
          "<div style='display:flex;gap:32px;flex-wrap:wrap;margin-top:40px;'>" +
            ["Direct", "Useful", "Opinionated", "Human"].map(function(v) {
              return "<div style='font-size:15px;font-weight:700;color:" + brass + ";'>" + v + "</div>";
            }).join("") +
          "</div></div></section>";
      } else if (ap === "team-grid") {
        body = "<section style='background:" + bone + ";padding:40px 40px 48px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0 0 48px;'>" + (brief.aboutBody || "Your company story.") + "</p></div></section>" +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:1160px;margin:0 auto;text-align:center;'>" +
            ["Founder", "Lead Designer", "Strategist", "Developer"].map(function(role) {
              return "<div><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Photo</div><div style='font-weight:700;color:" + ink + ";'>[Name]</div><div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + role + "</div></div>";
            }).join("") +
          "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>About image</div>" +
          "<div><p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0;'>" + (brief.aboutBody || "Your company story.") + "</p></div>" +
        "</div></section>";
      }
      return header + body;
    })(),

    process: (function() {
      var pp = patterns.process || "numbered-vertical";
      var steps = brief.processSteps || [["Discovery","We learn about your business and goals."],["Strategy","We create a plan tailored to you."],["Execute","We bring the plan to life."],["Deliver","You get the finished product, ready to use."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Process</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.processH1 || "How it works") + "</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>Simple and calm, from first call to final files.</p>" +
      "</div></section>";
      var body = "";
      if (pp === "icon-cards") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          steps.map(function(s, i) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;text-align:center;'>" +
              "<div style='font-size:32px;font-weight:800;color:" + brass + ";margin-bottom:16px;'>0" + (i+1) + "</div>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + s[0] + "</h3>" +
              "<p style='font-size:14px;color:" + stone + ";line-height:1.6;margin:0;'>" + s[1] + "</p></div>";
          }).join("") + "</div></section>";
      } else if (pp === "horizontal-timeline") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:flex;gap:0;position:relative;'>" +
            steps.map(function(s, i) {
              return "<div style='flex:1;text-align:center;padding:0 16px;'>" +
                "<div style='width:32px;height:32px;background:" + brass + ";border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;'>" + (i+1) + "</div>" +
                "<h3 style='font-size:16px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + s[0] + "</h3>" +
                "<p style='font-size:13px;color:" + stone + ";line-height:1.5;margin:0;'>" + s[1] + "</p></div>";
            }).join("") +
          "</div></div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          steps.map(function(s, i) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;" + (i < steps.length-1 ? "border-bottom:1px solid #E2DBCC;" : "") + "'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (i+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + s[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + s[1] + "</p></div></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
    })(),

    contact: (function() {
      var cp2 = patterns.contact || "split-form";
      if (cp2 === "centered-minimal") {
        return "<section style='background:" + bone + ";padding:100px 40px;text-align:center;'><div style='max-width:560px;margin:0 auto;'>" +
          "<h1 style='font-weight:800;font-size:clamp(32px,5vw,48px);color:" + ink + ";margin:0 0 16px;'>" + (brief.contactH1 || "Get in touch") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";margin:0 0 40px;line-height:1.7;'>" + (brief.contactSubhead || "We will get back to you within one business day.") + "</p>" +
          "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:8px;text-align:left;'>" +
            ["Name", "Email", "Message"].map(function(f) {
              return "<div style='margin-bottom:16px;'><div style='font-size:13px;font-weight:600;color:" + ink + ";margin-bottom:6px;'>" + f + "</div><div style='background:#f9f9f9;border:1px solid #E2DBCC;padding:12px;border-radius:4px;color:" + stone + ";font-size:14px;'>Enter " + f.toLowerCase() + "</div></div>";
            }).join("") +
            "<a style='display:block;padding:14px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;text-align:center;'>" + (brief.contactButton || "Send it over") + "</a>" +
          "</div></div></section>";
      } else {
        return "<section style='background:" + bone + ";padding:88px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:1160px;margin:0 auto;'>" +
          "<div>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Contact</div>" +
            "<h1 style='font-weight:800;font-size:clamp(32px,4vw,48px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.contactH1 || "Tell us about your project.") + "</h1>" +
            "<p style='font-size:17px;color:" + text + ";margin:0 0 32px;line-height:1.7;'>" + (brief.contactSubhead || "A real reply, usually within one business day.") + "</p>" +
            "<p style='font-size:15px;color:" + stone + ";'>" + (brief.contactReassurance || "No sales team. No automated funnel. Just one maker who will read it and write back.") + "</p>" +
          "</div>" +
          "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:8px;'>" +
            ["Name", "Email", "Company", "What do you need?", "Message"].map(function(f) {
              return "<div style='margin-bottom:16px;'><div style='font-size:13px;font-weight:600;color:" + ink + ";margin-bottom:6px;'>" + f + "</div><div style='background:#f9f9f9;border:1px solid #E2DBCC;padding:12px;border-radius:4px;color:" + stone + ";font-size:14px;'></div></div>";
            }).join("") +
            "<a style='display:block;padding:14px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;text-align:center;'>" + (brief.contactButton || "Send it over") + "</a>" +
          "</div>" +
        "</div></section>";
      }
    })(),

    landing: (function() {
      var lp = patterns.landing || "centered-dark";
      var benefits = [
        { num: "01", title: "Benefit one", body: "Explain the first key benefit clearly." },
        { num: "02", title: "Benefit two", body: "What makes this worth their time." },
        { num: "03", title: "Benefit three", body: "The final push to convert." },
      ];
      if (lp === "split-light") {
        return "<section style='background:" + bone + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:20px;'>" + (brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + ink + ";margin:0 0 20px;line-height:1.1;'>" + (brief.heroHeadline || "Your offer, front and center.") + "</h1>" +
              "<p style='font-size:17px;color:" + text + ";margin:0 0 36px;line-height:1.7;'>" + (brief.heroSubhead || "One clear message. One clear action.") + "</p>" +
              "<div style='display:flex;gap:16px;flex-wrap:wrap;'>" +
                "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>" + (brief.heroCta1 || "Get started") + "</a>" +
                "<a style='padding:14px 32px;background:transparent;color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid " + ink + ";border-radius:4px;'>" + (brief.heroCta2 || "Learn more") + "</a>" +
              "</div>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);'>" +
          "<div style='max-width:1160px;margin:0 auto;'>" +
            benefits.map(function(b) {
              return "<div style='display:grid;grid-template-columns:80px 1fr;gap:32px;padding:40px 0;border-bottom:1px solid #E2DBCC;align-items:start;'>" +
                "<div style='font-size:28px;font-weight:800;color:" + brass + ";'>" + b.num + "</div>" +
                "<div><h3 style='font-size:19px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + b.title + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.65;margin:0;'>" + b.body + "</p></div>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;text-align:center;'>" +
          "<h2 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 24px;'>" + (brief.heroHeadline || "Ready to get started?") + "</h2>" +
          "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>" + (brief.heroCta1 || "Get started") + "</a>" +
        "</section>";
      } else if (lp === "social-proof") {
        var logos = ["Partner A", "Partner B", "Partner C", "Partner D", "Partner E"];
        return "<section style='background:" + bone + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:20px;'>" + (brief.brandName || "Brand") + "</div>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + ink + ";margin:0 0 20px;line-height:1.1;'>" + (brief.heroHeadline || "Your offer, front and center.") + "</h1>" +
            "<p style='font-size:18px;color:" + text + ";margin:0 0 40px;line-height:1.7;'>" + (brief.heroSubhead || "One clear message. One clear action.") + "</p>" +
            "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>" + (brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>" +
        "<section style='background:#ffffff;padding:40px;border-top:1px solid #E2DBCC;border-bottom:1px solid #E2DBCC;'>" +
          "<div style='max-width:900px;margin:0 auto;text-align:center;'>" +
            "<p style='font-size:12px;color:" + stone + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Trusted by teams at</p>" +
            "<div style='display:flex;gap:40px;justify-content:center;flex-wrap:wrap;align-items:center;'>" +
              logos.map(function(l) {
                return "<div style='font-size:15px;font-weight:700;color:" + stone + ";opacity:.5;'>" + l + "</div>";
              }).join("") +
            "</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;max-width:1060px;margin:0 auto;'>" +
            benefits.map(function(b) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:36px 28px;border-radius:6px;'>" +
                "<div style='font-size:28px;color:" + brass + ";margin-bottom:16px;font-weight:800;'>" + b.num + "</div>" +
                "<h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 10px;'>" + b.title + "</h3>" +
                "<p style='font-size:15px;color:" + stone + ";line-height:1.65;margin:0;'>" + b.body + "</p>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>" +
        "<section style='background:" + ink + ";padding:80px 40px;text-align:center;'>" +
          "<h2 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;'>Ready?</h2>" +
          "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>" + (brief.heroCta1 || "Get started") + "</a>" +
        "</section>";
      } else {
        // centered-dark (default)
        return "<section style='background:" + ink + ";min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 40px;text-align:center;'>" +
          "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,64px);line-height:1.08;color:" + warmWhite + ";max-width:800px;margin:0 0 24px;'>" + (brief.heroHeadline || "Your offer, front and center.") + "</h1>" +
          "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;max-width:520px;margin:0 0 40px;line-height:1.7;'>" + (brief.heroSubhead || "One clear message. One clear action.") + "</p>" +
          "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>" + (brief.heroCta1 || "Get started") + "</a>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;max-width:1000px;margin:0 auto;text-align:center;'>" +
          benefits.map(function(b) {
            return "<div style='padding:32px;'><div style='font-size:32px;color:" + brass + ";margin-bottom:12px;font-weight:800;'>" + b.num + "</div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:8px;'>" + b.title + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;'>" + b.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + ink + ";padding:80px 40px;text-align:center;'>" +
          "<h2 style='font-size:clamp(28px,4vw,44px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;'>Ready?</h2>" +
          "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>" + (brief.heroCta1 || "Get started") + "</a>" +
        "</section>";
      }
    })(),

    // ── TEAM ──
    team: (function() {
      var tp = patterns.team || "photo-grid";
      var members = [
        { role: "Founder & CEO", name: "[Name]" },
        { role: "Lead Designer", name: "[Name]" },
        { role: "Strategist", name: "[Name]" },
        { role: "Developer", name: "[Name]" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>The Team</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>The people behind the work.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>Every person here chose to be here.</p>" +
      "</section>";
      if (tp === "featured-founder") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:56px;padding-bottom:56px;border-bottom:1px solid #E2DBCC;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:3/4;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Founder photo</div>" +
              "<div>" +
                "<div style='font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brass + ";margin-bottom:12px;'>Founder</div>" +
                "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:800;color:" + ink + ";margin:0 0 8px;'>[Founder Name]</h2>" +
                "<p style='font-size:15px;color:" + stone + ";margin-bottom:20px;'>Founder & CEO</p>" +
                "<p style='font-size:16px;color:" + text + ";line-height:1.7;'>A short founder bio that establishes credibility and voice. Who they are, where they came from, and why they started this.</p>" +
              "</div>" +
            "</div>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;'>" +
              members.slice(1).map(function(m) {
                return "<div style='text-align:center;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:14px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div>" +
                  "<div style='font-size:15px;font-weight:700;color:" + ink + ";'>" + m.name + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + m.role + "</div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</div></section>";
      } else if (tp === "horizontal-list") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            members.map(function(m) {
              return "<div style='display:grid;grid-template-columns:100px 1fr;gap:28px;padding:32px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div style='background:#e0ddd7;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Photo</div>" +
                "<div>" +
                  "<div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + m.name + "</div>" +
                  "<div style='font-size:13px;color:" + brass + ";font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;'>" + m.role + "</div>" +
                  "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Short bio for this team member — background, focus, and what they bring.</p>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // photo-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            members.map(function(m) {
              return "<div style='text-align:center;'><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div><div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + m.name + "</div><div style='font-size:14px;color:" + stone + ";margin-top:4px;'>" + m.role + "</div></div>";
            }).join("") +
          "</div></section>";
      }
    })(),

    // ── BLOG ──
    blog: (function() {
      var bp = patterns.blog || "grid-3col";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Journal</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 48px;line-height:1.1;'>Latest thoughts</h1>" +
      "</div></section>";
      var articles = ["Strategy & Growth", "Behind the Scenes", "Industry Insights", "Case Study", "Tips & Guides", "News"];
      if (bp === "featured-plus-grid") {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:16/10;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Featured image</div>" +
            "<div style='display:flex;flex-direction:column;justify-content:center;'><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;'>Featured</div>" +
            "<h2 style='font-size:28px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>Featured Article Title</h2>" +
            "<p style='font-size:16px;color:" + stone + ";line-height:1.6;margin:0;'>A longer excerpt that gives readers a reason to dive into this featured piece.</p></div>" +
          "</div>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            articles.slice(0,3).map(function(cat) {
              return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;margin-bottom:12px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" +
                "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>" + cat + "</div>" +
                "<h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>Article Title</h3>" +
                "<p style='font-size:14px;color:" + stone + ";line-height:1.5;margin:0;'>Short excerpt text.</p></div>";
            }).join("") +
          "</div></div></section>";
      } else if (bp === "list-view") {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          articles.slice(0,5).map(function(cat) {
            return "<div style='display:grid;grid-template-columns:120px 1fr;gap:20px;padding:24px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Thumb</div>" +
              "<div><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>" + cat + "</div>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 4px;'>Article Title Goes Here</h3>" +
              "<p style='font-size:13px;color:" + stone + ";margin:0;'>5 min read</p></div></div>";
          }).join("") +
        "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
          articles.slice(0,3).map(function(cat) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" +
              "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>" + cat + "</div>" +
              "<h3 style='font-size:20px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>Article Title Goes Here</h3>" +
              "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Short excerpt giving readers a reason to click through.</p>" +
              "<div style='font-size:13px;color:" + stone + ";margin-top:12px;'>5 min read</div></div>";
          }).join("") +
        "</div></section>";
      }
    })(),

    "blog-post": (function() {
      if (variant === "B") {
        // Wide editorial — no sidebar column, wider content, pull quote prominent
        return "<section style='background:" + bone + ";padding:80px 40px 40px;max-width:880px;margin:0 auto;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600;'>Category</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Article Title Goes Here</h1>" +
          "<p style='font-size:15px;color:" + stone + ";margin-bottom:40px;'>Published on [Date] · 5 min read</p>" +
        "</section>" +
        "<section style='background:#e0ddd7;padding:0;'><div style='aspect-ratio:21/9;max-height:480px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Featured image — full width</div></section>" +
        "<section style='background:" + bone + ";padding:56px 40px 96px;'><div style='max-width:880px;margin:0 auto;'>" +
          "<blockquote style='border-left:4px solid " + brass + ";padding:20px 28px;margin:0 0 40px;font-size:22px;color:" + ink + ";font-style:italic;line-height:1.5;background:#fff;border-radius:0 4px 4px 0;'>A key pull quote that sets the tone for the piece and gives readers a reason to keep reading.</blockquote>" +
          "<div style='font-size:17px;color:" + text + ";line-height:1.85;'>" +
            "<p style='margin-bottom:24px;'>Opening paragraph of the article. This is where you hook the reader and set up the premise of what they will learn.</p>" +
            "<h2 style='font-size:26px;font-weight:700;color:" + ink + ";margin:48px 0 16px;'>Section heading</h2>" +
            "<p style='margin-bottom:24px;'>Body copy continues here with supporting details, examples, and insights that develop the main argument.</p>" +
            "<p>Concluding thoughts that tie everything together and lead naturally to a call to action.</p>" +
          "</div>" +
        "</div></section>";
      }
      // Variant A — narrow centered with featured image (current)
      return "<section style='background:" + bone + ";padding:80px 40px;max-width:760px;margin:0 auto;'>" +
        "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;'>Category</div>" +
        "<h1 style='font-size:clamp(32px,5vw,48px);font-weight:800;color:" + ink + ";margin:0 0 16px;line-height:1.15;'>Article Title Goes Here</h1>" +
        "<p style='font-size:15px;color:" + stone + ";margin-bottom:32px;'>Published on [Date] · 5 min read</p>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/9;margin-bottom:40px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Featured image</div>" +
        "<div style='font-size:17px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:24px;'>Opening paragraph of the article. This is where you hook the reader and set up the premise.</p><h2 style='font-size:24px;font-weight:700;color:" + ink + ";margin:40px 0 16px;'>Section heading</h2><p style='margin-bottom:24px;'>Body copy continues here with supporting details, examples, and insights.</p><blockquote style='border-left:3px solid " + brass + ";padding:16px 24px;margin:32px 0;color:" + ink + ";font-size:18px;'>A pull quote that highlights a key insight from the article.</blockquote><p>Concluding thoughts that tie everything together and lead to a call to action.</p></div>" +
      "</section>";
    })(),

    // ── FAQ ──
    faq: (function() {
      var fp = patterns.faq || "accordion";
      var questions = [["How does pricing work?","Every price is a starting point that scales with scope."],["What is the typical timeline?","Most projects wrap in 2-4 weeks depending on complexity."],["Do you offer revisions?","Yes, a set number of revision rounds agreed up front."],["What do I need to get started?","A brief conversation about your business and goals."],["Can I see examples?","Absolutely. Check our work page for recent projects."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>FAQ</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Common questions</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;'>If you do not see your answer here, reach out directly.</p>" +
      "</div></section>";
      if (fp === "two-column") {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1160px;margin:0 auto;'>" +
          questions.map(function(q) {
            return "<div style='padding:24px 0;border-bottom:1px solid #E2DBCC;'><h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + q[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + q[1] + "</p></div>";
          }).join("") +
        "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          questions.map(function(q) {
            return "<div style='border-bottom:1px solid #E2DBCC;padding:24px 0;'><div style='display:flex;justify-content:space-between;align-items:center;'><h3 style='font-size:17px;font-weight:600;color:" + ink + ";margin:0;'>" + q[0] + "</h3><span style='font-size:20px;color:" + brass + ";'>+</span></div><p style='font-size:15px;color:" + stone + ";line-height:1.7;margin:12px 0 0;'>" + q[1] + "</p></div>";
          }).join("") +
        "</div></section>";
      }
    })(),

    pricing: (function() {
      var pp2 = patterns.pricing || "three-tier";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;text-align:center;'><div style='max-width:800px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Pricing</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Simple, transparent pricing</h1>" +
        "<p style='font-size:17px;color:" + text + ";margin:0;'>No hidden fees. Pick what works.</p>" +
      "</div></section>";
      var tiers = [["Starter","$500","For small projects"],["Professional","$1,500","For growing businesses"],["Enterprise","Custom","For large-scale needs"]];
      if (pp2 === "two-tier") {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;'>" +
          tiers.slice(0,2).map(function(t, i) {
            var featured = i === 1;
            return "<div style='background:" + (featured ? asphalt : "#fff") + ";border:1px solid #E2DBCC;padding:48px 32px;text-align:center;border-radius:4px;'>" +
              "<div style='font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + (featured ? brass : brassDp) + ";margin-bottom:16px;'>" + t[0] + "</div>" +
              "<div style='font-size:clamp(36px,5vw,52px);font-weight:800;color:" + (featured ? warmWhite : ink) + ";margin-bottom:8px;'>" + t[1] + "</div>" +
              "<p style='font-size:15px;color:" + stone + ";margin-bottom:32px;'>" + t[2] + "</p>" +
              "<a style='display:inline-block;padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Get started</a></div>";
          }).join("") + "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1000px;margin:0 auto;'>" +
          tiers.map(function(t, i) {
            var featured = i === 1;
            return "<div style='background:" + (featured ? asphalt : "#fff") + ";border:1px solid #E2DBCC;padding:40px 32px;text-align:center;border-radius:4px;'>" +
              "<div style='font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + (featured ? brass : brassDp) + ";margin-bottom:16px;'>" + t[0] + "</div>" +
              "<div style='font-size:clamp(32px,4vw,48px);font-weight:800;color:" + (featured ? warmWhite : ink) + ";margin-bottom:8px;'>" + t[1] + "</div>" +
              "<p style='font-size:14px;color:" + stone + ";margin-bottom:32px;'>" + t[2] + "</p>" +
              "<a style='display:inline-block;padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Get started</a></div>";
          }).join("") + "</div></section>";
      }
    })(),

    testimonials: (function() {
      var tp = patterns.testimonials || "card-grid";
      var quotes = [
        { q: "This changed everything for our business.", name: "Client Name", role: "Role, Company" },
        { q: "Professional, efficient, and genuinely cared about the outcome.", name: "Client Name", role: "Role, Company" },
        { q: "We saw results within the first month.", name: "Client Name", role: "Role, Company" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 48px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Testimonials</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>What our clients say.</h1>" +
      "</section>";
      if (tp === "single-feature") {
        return "<section style='background:" + ink + ";padding:120px 40px;text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:60px;color:" + brass + ";line-height:1;margin-bottom:24px;'>\u201c</div>" +
            "<p style='font-size:clamp(22px,3vw,32px);color:" + warmWhite + ";line-height:1.5;font-weight:300;margin:0 0 40px;'>" + quotes[0].q + "</p>" +
            "<div style='width:40px;height:2px;background:" + brass + ";margin:0 auto 24px;'></div>" +
            "<div style='font-size:15px;font-weight:700;color:" + warmWhite + ";'>" + quotes[0].name + "</div>" +
            "<div style='font-size:13px;color:" + stone + ";margin-top:6px;'>" + quotes[0].role + "</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px 96px;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:900px;margin:0 auto;'>" +
            quotes.slice(1).map(function(qt) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'>" +
                "<p style='font-size:16px;color:" + ink + ";line-height:1.6;margin:0 0 20px;'>" + qt.q + "</p>" +
                "<div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + qt.name + "</div>" +
                "<div style='font-size:13px;color:" + stone + ";'>" + qt.role + "</div>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>";
      } else if (tp === "alternating-quotes") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:960px;margin:0 auto;'>" +
            quotes.map(function(qt, i) {
              var isRight = i % 2 === 1;
              return "<div style='display:grid;grid-template-columns:72px 1fr;gap:24px;padding:40px 0;border-bottom:1px solid #E2DBCC;align-items:start;" + (isRight ? "direction:rtl;" : "") + "'>" +
                "<div style='background:#e0ddd7;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;" + (isRight ? "direction:ltr;" : "") + "'>Photo</div>" +
                "<div style='" + (isRight ? "direction:ltr;text-align:right;" : "") + "'>" +
                  "<p style='font-size:18px;color:" + ink + ";line-height:1.6;margin:0 0 16px;font-style:italic;'>\u201c" + qt.q + "\u201d</p>" +
                  "<div style='font-size:14px;font-weight:700;color:" + ink + ";'>" + qt.name + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";'>" + qt.role + "</div>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // card-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            quotes.map(function(qt) {
              return "<div style='background:#fff;border-left:3px solid " + brass + ";padding:32px;'><p style='font-family:Inter,sans-serif;font-size:18px;color:" + ink + ";line-height:1.5;margin:0 0 20px;'>" + qt.q + "</p><div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + qt.name + "</div><div style='font-size:13px;color:" + stone + ";'>" + qt.role + "</div></div>";
            }).join("") +
          "</div></section>";
      }
    })(),

    // ── EVENTS ──
    events: (function() {
      var ep = patterns.events || "date-list";
      var evts = [
        { date: "JAN 15", title: "Workshop: Brand Strategy Fundamentals", meta: "10:00 AM — 2:00 PM · Virtual" },
        { date: "FEB 22", title: "Networking Mixer", meta: "6:00 PM — 9:00 PM · Downtown Studio" },
        { date: "MAR 10", title: "Annual Conference", meta: "All Day · Convention Center" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Events</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>Upcoming events.</h1>" +
      "</section>";
      if (ep === "event-cards") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px;max-width:1160px;margin:0 auto;'>" +
              evts.map(function(e) {
                return "<div style='background:#ffffff;border:1px solid #E2DBCC;border-radius:6px;overflow:hidden;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
                  "<div style='padding:24px;'>" +
                    "<div style='font-size:12px;font-weight:800;color:" + brass + ";letter-spacing:1px;margin-bottom:10px;'>" + e.date + "</div>" +
                    "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;line-height:1.3;'>" + e.title + "</h3>" +
                    "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;'>" + e.meta + "</p>" +
                    "<a style='display:inline-block;padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register</a>" +
                  "</div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</section>";
      } else if (ep === "featured-next") {
        var next = evts[0];
        return "<section style='background:" + ink + ";padding:96px 40px;'>" +
          "<div style='max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Next Event</div>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:2px;margin-bottom:16px;'>" + next.date + "</div>" +
              "<h2 style='font-size:clamp(28px,4vw,44px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.15;'>" + next.title + "</h2>" +
              "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;margin:0 0 32px;'>" + next.meta + "</p>" +
              "<a style='display:inline-block;padding:14px 36px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register now</a>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          evts.slice(1).map(function(e) {
            return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + e.date + "</div>" +
              "<div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + e.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + e.meta + "</div></div>" +
              "<a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else {
        // date-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            evts.map(function(e) {
              return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'><div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + e.date + "</div><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + e.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + e.meta + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a></div>";
            }).join("") +
          "</div></section>";
      }
    })(),

    // ── CAREERS ──
    careers: (function() {
      var cp = patterns.careers || "job-list";
      var jobs = [
        { title: "Senior Designer", meta: "Full-time · Remote" },
        { title: "Project Manager", meta: "Full-time · Hybrid" },
        { title: "Content Strategist", meta: "Contract · Remote" },
      ];
      var values = ["Ownership", "Craft", "Clarity", "Speed", "Honesty"];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Careers</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Work with us.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>We are always looking for talented people who care about the craft.</p>" +
      "</section>";
      var jobList = "<div style='max-width:800px;margin:0 auto;'>" +
        jobs.map(function(j) {
          return "<div style='display:flex;justify-content:space-between;align-items:center;padding:24px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + j.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + j.meta + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Apply</a></div>";
        }).join("") +
      "</div>";
      if (cp === "values-first") {
        return "<section style='background:" + ink + ";padding:80px 40px;'>" +
          "<div style='max-width:1060px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>Our values</div>" +
            "<div style='display:flex;gap:24px;flex-wrap:wrap;'>" +
              values.map(function(v) {
                return "<div style='padding:14px 24px;border:1px solid rgba(255,255,255,.15);color:" + warmWhite + ";font-size:14px;font-weight:600;border-radius:4px;'>" + v + "</div>";
              }).join("") +
            "</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'>" + jobList + "</section>";
      } else if (cp === "split-layout") {
        return header +
          "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<h2 style='font-size:24px;font-weight:800;color:" + ink + ";margin:0 0 16px;'>Why join us</h2>" +
              "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin-bottom:28px;'>We move fast, care about craft, and give people room to own their work. No bureaucracy. No bottlenecks.</p>" +
              "<div style='display:flex;flex-direction:column;gap:12px;'>" +
                values.map(function(v) {
                  return "<div style='display:flex;align-items:center;gap:12px;'><div style='width:6px;height:6px;background:" + brass + ";border-radius:50%;flex-shrink:0;'></div><span style='font-size:15px;font-weight:600;color:" + ink + ";'>" + v + "</span></div>";
                }).join("") +
              "</div>" +
            "</div>" +
            "<div>" +
              "<h2 style='font-size:24px;font-weight:800;color:" + ink + ";margin:0 0 24px;'>Open roles</h2>" +
              jobs.map(function(j) {
                return "<div style='display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + j.title + "</div><div style='font-size:13px;color:" + stone + ";'>" + j.meta + "</div></div><a style='padding:8px 20px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Apply</a></div>";
              }).join("") +
            "</div>" +
          "</div></section>";
      } else {
        // job-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'>" + jobList + "</section>";
      }
    })(),

    // ── CASE STUDY ──
    "case-study": (function() {
      var csp = patterns["case-study"] || "dark-hero-metrics";
      var metrics = [
        { label: "Challenge", body: "What the client was facing" },
        { label: "Solution", body: "How we approached it" },
        { label: "Result", body: "The measurable outcome" },
      ];
      if (csp === "editorial-light") {
        return "<section style='background:" + bone + ";padding:100px 40px 60px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Case Study</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Client Name: Project Title</h1>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.7;margin:0;'>Brief overview of the challenge and what was delivered.</p>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:16/9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:56px;'>Project hero image</div>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 56px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:32px;padding:40px 0;border-top:1px solid #E2DBCC;border-bottom:1px solid #E2DBCC;margin-bottom:48px;'>" +
            metrics.map(function(m) {
              return "<div><div style='font-size:11px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-weight:600;'>" + m.label + "</div><p style='font-size:15px;color:" + text + ";line-height:1.6;margin:0;'>" + m.body + "</p></div>";
            }).join("") +
          "</div>" +
          "<div style='font-size:17px;color:" + text + ";line-height:1.8;'>" +
            "<p style='margin-bottom:24px;'>The full editorial narrative goes here. Context, approach, execution, and results written for a reader who wants the story, not a slide deck.</p>" +
            "<blockquote style='border-left:3px solid " + brass + ";padding:16px 24px;margin:32px 0;font-size:20px;color:" + ink + ";font-style:italic;line-height:1.5;'>A pull quote that highlights a key moment or result from the project.</blockquote>" +
            "<p>Concluding section with results and what came next.</p>" +
          "</div>" +
        "</div></section>";
      } else if (csp === "numbers-first") {
        var stats = [["3x", "Revenue growth"], ["6mo", "Time to results"], ["98%", "Client retention"]];
        return "<section style='background:" + bone + ";padding:100px 40px 60px;'><div style='max-width:800px;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Case Study</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Client Name: Project Title</h1>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.7;margin:0;'>Brief overview of the challenge and the outcome.</p>" +
        "</div></section>" +
        "<section style='background:" + ink + ";padding:80px 40px;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;max-width:900px;margin:0 auto;text-align:center;'>" +
            stats.map(function(s) {
              return "<div><div style='font-size:clamp(48px,6vw,72px);font-weight:800;color:" + brass + ";line-height:1;margin-bottom:8px;'>" + s[0] + "</div><div style='font-size:14px;color:" + warmWhite + ";opacity:.7;text-transform:uppercase;letter-spacing:1px;'>" + s[1] + "</div></div>";
            }).join("") +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;max-width:900px;margin:0 auto;'>" +
          metrics.map(function(m) {
            return "<div><div style='font-size:13px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;'>" + m.label + "</div><p style='font-size:16px;color:" + text + ";line-height:1.6;'>" + m.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 80px;max-width:760px;margin:0 auto;'><div style='font-size:17px;color:" + text + ";line-height:1.8;'><p>The full narrative goes here — context, approach, execution, and the story behind the numbers.</p></div></section>";
      } else {
        // dark-hero-metrics (default)
        return "<section style='background:" + ink + ";padding:100px 40px;'>" +
          "<div style='max-width:800px;'>" +
            "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Case Study</div>" +
            "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;line-height:1.1;'>Client Name: Project Title</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;line-height:1.7;'>Brief overview of the challenge and the outcome.</p>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;max-width:900px;margin:0 auto 48px;text-align:center;'>" +
          metrics.map(function(m) {
            return "<div><div style='font-size:13px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;'>" + m.label + "</div><p style='font-size:16px;color:" + text + ";line-height:1.6;'>" + m.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 80px;max-width:760px;margin:0 auto;'><div style='font-size:17px;color:" + text + ";line-height:1.8;'><p>The full case study narrative goes here — context, approach, execution, and results with real numbers.</p></div></section>";
      }
    })(),

    // ── THANK YOU ──
    "thank-you": "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-size:48px;margin-bottom:24px;'>✓</div>" +
      "<h1 style='font-size:clamp(32px,5vw,48px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Thank you.</h1>" +
      "<p style='font-size:18px;color:" + text + ";max-width:480px;margin:0 auto 32px;line-height:1.7;'>Your message has been received. We will get back to you within one business day.</p>" +
      "<a href='/' style='font-size:14px;color:" + brassDp + ";text-decoration:underline;'>← Back to homepage</a>" +
    "</section>",

    // ── PRIVACY / TERMS ──
    privacy: "<section style='background:" + bone + ";padding:80px 40px;'><div style='max-width:760px;margin:0 auto;'>" +
      "<h1 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 32px;'>Privacy Policy</h1>" +
      "<div style='font-size:16px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:20px;'>Last updated: [Date]</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Information We Collect</h2><p style='margin-bottom:20px;'>Placeholder for your privacy policy content.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>How We Use Your Information</h2><p style='margin-bottom:20px;'>Placeholder for usage details.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Contact</h2><p>For questions about this policy, contact us at [email].</p></div>" +
    "</div></section>",

    terms: "<section style='background:" + bone + ";padding:80px 40px;'><div style='max-width:760px;margin:0 auto;'>" +
      "<h1 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 32px;'>Terms of Service</h1>" +
      "<div style='font-size:16px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:20px;'>Last updated: [Date]</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Agreement to Terms</h2><p style='margin-bottom:20px;'>By accessing this website, you agree to these terms.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Services</h2><p style='margin-bottom:20px;'>Description of services provided.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Limitation of Liability</h2><p>Standard limitation clause placeholder.</p></div>" +
    "</div></section>",

    // ── 404 ──
    "404": "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-family:Inter,sans-serif;font-size:clamp(80px,15vw,160px);font-weight:300;color:" + brass + ";line-height:1;margin-bottom:16px;'>404</div>" +
      "<h1 style='font-size:clamp(24px,4vw,36px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Page not found.</h1>" +
      "<p style='font-size:17px;color:" + text + ";max-width:400px;margin:0 auto 32px;'>The page you are looking for does not exist or has been moved.</p>" +
      "<a href='/' style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;display:inline-block;'>Back to homepage</a>" +
    "</section>",

    // ── PORTFOLIO SINGLE ──
    portfolio: (function() {
      if (variant === "B") {
        // Editorial: bone hero + single full-width image + case study narrative
        return "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:800px;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Portfolio</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Project Title</h1>" +
          "<p style='font-size:17px;color:" + text + ";margin:0;line-height:1.7;'>Client Name · Category · Year</p>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 40px;'><div style='background:#e0ddd7;aspect-ratio:16/7;max-width:1160px;margin:0 auto;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Project hero image</div></section>" +
        "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 2fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
          "<div>" +
            "<div style='margin-bottom:32px;'><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Client</div><p style='font-size:15px;color:" + text + ";'>Client Name</p></div>" +
            "<div style='margin-bottom:32px;'><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Category</div><p style='font-size:15px;color:" + text + ";'>Category</p></div>" +
            "<div><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Year</div><p style='font-size:15px;color:" + text + ";'>2026</p></div>" +
          "</div>" +
          "<div><p style='font-size:17px;color:" + text + ";line-height:1.8;'>Full project description, approach, and results go here. This editorial layout gives the narrative room to breathe alongside the images.</p></div>" +
        "</div></section>";
      }
      // Variant A — dark hero + image grid (current)
      return "<section style='background:" + ink + ";padding:100px 40px;'>" +
        "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Portfolio</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.1;'>Project Title</h1>" +
        "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;'>Client Name · Category · Year</p>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:64px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:16px;max-width:1160px;margin:0 auto;'>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:48px 40px 96px;'><div style='max-width:760px;margin:0 auto;font-size:17px;color:" + text + ";line-height:1.8;'><p>Project description and details go here.</p></div></section>";
    })(),

    // ── LOCATION ──
    location: (function() {
      if (variant === "B") {
        // Centered — address first, map below
        return "<section style='background:" + bone + ";padding:88px 40px;text-align:center;'><div style='max-width:640px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Location</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 24px;'>Visit us.</h1>" +
          "<p style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>123 Main Street, Suite 100</p>" +
          "<p style='font-size:16px;color:" + stone + ";margin:0 0 32px;'>City, State 00000</p>" +
          "<div style='display:flex;gap:32px;justify-content:center;flex-wrap:wrap;margin-bottom:48px;'>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Phone</div><div style='font-size:15px;color:" + text + ";'>(555) 000-0000</div></div>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Email</div><div style='font-size:15px;color:" + text + ";'>hello@brand.com</div></div>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Hours</div><div style='font-size:15px;color:" + text + ";'>Mon–Fri 9am–5pm</div></div>" +
          "</div>" +
        "</div></section>" +
        "<section style='background:#e0ddd7;padding:0;'><div style='aspect-ratio:21/9;max-height:360px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:14px;'>Map embed</div></section>";
      }
      // Variant A — map left, address right (current)
      return "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Location</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>Visit us.</h1>" +
        "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;max-width:1000px;'>" +
          "<div><div style='background:#e0ddd7;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:16px;'>Map embed</div></div>" +
          "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:16px;'>Address</h3><p style='font-size:16px;color:" + text + ";line-height:1.7;margin-bottom:24px;'>123 Main Street<br>Suite 100<br>City, State 00000</p><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:16px;'>Hours</h3><p style='font-size:16px;color:" + text + ";line-height:1.7;'>Monday – Friday: 9am – 5pm<br>Saturday – Sunday: Closed</p></div>" +
        "</div>" +
      "</section>";
    })(),
    // ── EVENT SINGLE ──
    "event-single": (function() {
      if (variant === "B") {
        // Light centered layout
        return "<section style='background:" + bone + ";padding:88px 40px;text-align:center;'><div style='max-width:640px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Event</div>" +
          "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Event Title Goes Here</h1>" +
          "<div style='display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;'>" +
            "<span style='font-size:15px;color:" + stone + ";'>March 15, 2026</span>" +
            "<span style='font-size:15px;color:" + stone + ";'>6:00 PM — 9:00 PM</span>" +
            "<span style='font-size:15px;color:" + stone + ";'>Downtown Convention Center</span>" +
          "</div>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;margin-bottom:48px;'>Register Now</a>" +
        "</div></section>" +
        "<section style='background:#ffffff;padding:64px 40px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<h2 style='font-weight:700;font-size:24px;color:" + ink + ";margin:0 0 16px;'>About This Event</h2>" +
          "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0 0 32px;'>Event description with details about what attendees can expect, who should attend, and what they will learn or experience.</p>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;'>" +
            "<div><h3 style='font-weight:700;font-size:15px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;'>Schedule</h3><p style='font-size:15px;color:" + stone + ";line-height:1.8;'>6:00 PM — Doors open<br>6:30 PM — Opening remarks<br>7:00 PM — Main session<br>8:30 PM — Networking</p></div>" +
            "<div><h3 style='font-weight:700;font-size:15px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;'>Location</h3><div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Map embed</div></div>" +
          "</div>" +
        "</div></section>";
      }
      // Variant A — dark hero (current)
      return "<section style='background:" + ink + ";padding:88px 40px;'><div style='max-width:900px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Event</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + warmWhite + ";margin:0 0 16px;line-height:1.1;'>Event Title Goes Here</h1>" +
        "<div style='display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;'>" +
          "<span style='font-size:15px;color:" + stone + ";'>March 15, 2026</span>" +
          "<span style='font-size:15px;color:" + stone + ";'>6:00 PM — 9:00 PM</span>" +
          "<span style='font-size:15px;color:" + stone + ";'>Downtown Convention Center</span>" +
        "</div>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Register Now</a>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:900px;margin:0 auto;'>" +
        "<div><div style='background:#e0ddd7;aspect-ratio:16/10;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Event image</div></div>" +
        "<div><h2 style='font-weight:700;font-size:24px;color:" + ink + ";margin:0 0 16px;'>About This Event</h2><p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0 0 24px;'>Event description with details about what attendees can expect.</p><h3 style='font-weight:700;font-size:16px;color:" + ink + ";margin:0 0 12px;'>Schedule</h3><p style='font-size:15px;color:" + stone + ";line-height:1.8;margin:0;'>6:00 PM — Doors open<br>6:30 PM — Opening remarks<br>7:00 PM — Main session<br>9:00 PM — Close</p></div>" +
      "</div></section>";
    })(),

    // ── PRESS / MEDIA ──
    press: (function() {
      var articles = [["How This Startup is Changing the Game","Forbes · January 2026"],["10 Companies to Watch in 2026","Inc. · March 2026"],["The Future of Digital Services","TechCrunch · May 2026"]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Press</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>In the media</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Coverage, features, and media mentions.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Featured hero article + grid
        return "<section style='background:" + ink + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;'>Featured Coverage</div>" +
          "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.2;'>" + articles[0][0] + "</h2>" +
          "<p style='font-size:15px;color:" + stone + ";margin:0 0 24px;'>" + articles[0][1] + "</p>" +
          "<a style='font-size:14px;color:" + brass + ";font-weight:600;text-decoration:none;'>Read the story →</a></div>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Press image</div>" +
        "</div></section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:1160px;margin:0 auto;'>" +
          articles.slice(1).map(function(a) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:28px;border-radius:4px;'>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + a[0] + "</h3>" +
              "<div style='font-size:13px;color:" + stone + ";margin-bottom:16px;'>" + a[1] + "</div>" +
              "<a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;'>Read →</a></div>";
          }).join("") +
        "</div></section>";
      }
      // Variant A — logo bar + article list (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 48px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;padding:40px 0;border-bottom:1px solid #E2DBCC;'>" +
            ["Forbes", "Inc.", "TechCrunch", "Fast Company", "Bloomberg"].map(function(pub) {
              return "<div style='text-align:center;padding:20px;background:#fff;border:1px solid #E2DBCC;border-radius:4px;'><div style='font-size:18px;font-weight:700;color:" + stone + ";'>" + pub + "</div></div>";
            }).join("") +
          "</div>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          articles.map(function(a) {
            return "<div style='display:grid;grid-template-columns:1fr auto;gap:24px;padding:24px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 4px;'>" + a[0] + "</h3><div style='font-size:14px;color:" + stone + ";'>" + a[1] + "</div></div>" +
              "<a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;white-space:nowrap;'>Read →</a></div>";
          }).join("") +
        "</div></section>";
    })(),

    // ── PARTNERS ──
    partners: (function() {
      var partnerList = ["Partner One","Partner Two","Partner Three","Partner Four","Partner Five","Partner Six"];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Partners</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Companies we work with</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Strategic partnerships that strengthen what we deliver.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Description list
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
            partnerList.map(function(p) {
              return "<div style='display:grid;grid-template-columns:80px 1fr;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div style='background:#e0ddd7;width:64px;height:64px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:10px;'>Logo</div>" +
                "<div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + p + "</div><p style='font-size:14px;color:" + stone + ";margin:0;line-height:1.5;'>A brief description of what this partner does and how the relationship benefits clients.</p></div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      }
      // Variant A — logo grid (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 48px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          partnerList.map(function(p) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:40px 24px;text-align:center;border-radius:4px;'>" +
              "<div style='background:#e0ddd7;width:80px;height:80px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Logo</div>" +
              "<div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + p + "</div></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:#ffffff;padding:80px 40px;text-align:center;'><div style='max-width:600px;margin:0 auto;'>" +
          "<h2 style='font-weight:800;font-size:28px;color:" + ink + ";margin:0 0 16px;'>Become a partner</h2>" +
          "<p style='font-size:16px;color:" + text + ";margin:0 0 32px;line-height:1.7;'>Interested in working together? We would love to hear from you.</p>" +
          "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Get in touch</a>" +
        "</div></section>";
    })(),

    // ── RESOURCES ──
    resources: (function() {
      var items = [["Getting Started Guide","A step-by-step walkthrough for new clients.","PDF"],["Brand Toolkit","Templates, guidelines, and assets for your brand.","ZIP"],["Project Brief Template","Fill this out before our first meeting.","DOCX"],["Case Study Collection","Real results from real projects.","PDF"]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Resources</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Guides, tools, and downloads</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Everything you need to get the most out of working with us.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Categorized list
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
            items.map(function(r) {
              return "<div style='display:grid;grid-template-columns:1fr auto;gap:24px;padding:20px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + r[0] + "</div><div style='font-size:14px;color:" + stone + ";'>" + r[1] + "</div></div>" +
                "<div style='display:flex;align-items:center;gap:12px;'><span style='font-size:11px;font-weight:700;color:" + brassDp + ";background:rgba(180,83,9,.1);padding:4px 8px;border-radius:3px;'>" + r[2] + "</span><a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;white-space:nowrap;'>Download →</a></div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      }
      // Variant A — card grid (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          items.map(function(r) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:28px;border-radius:4px;display:flex;gap:20px;align-items:flex-start;'>" +
              "<div style='width:48px;height:48px;background:" + bone + ";border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:" + brassDp + ";flex-shrink:0;'>" + r[2] + "</div>" +
              "<div><h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 6px;'>" + r[0] + "</h3><p style='font-size:14px;color:" + stone + ";line-height:1.5;margin:0 0 12px;'>" + r[1] + "</p><a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;'>Download →</a></div></div>";
          }).join("") +
        "</div></section>";
    })(),

    // ── DOWNLOADS ──
    // ── DOWNLOADS ──
    downloads: (function() {
      var ditems = [["Brand Guidelines Template","Start with a professional framework."],["Social Media Calendar","Plan your content month by month."],["Project Scope Template","Define deliverables before you start."],["Invoice Template","Clean, professional billing."]];
      var dheader = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Downloads</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Free downloads</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Grab what you need. No email required.</p>" +
      "</div></section>";
      if (variant === "B") {
        return dheader + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          ditems.map(function(d) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;text-align:center;'>" +
              "<div style='width:48px;height:48px;background:rgba(180,83,9,.1);border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:" + brassDp + ";'>PDF</div>" +
              "<h3 style='font-size:15px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + d[0] + "</h3>" +
              "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;line-height:1.5;'>" + d[1] + "</p>" +
              "<a style='padding:10px 20px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Download</a>" +
            "</div>";
          }).join("") + "</div></section>";
      }
      return dheader + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
        ditems.map(function(d) {
          return "<div style='display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + d[0] + "</div><div style='font-size:14px;color:" + stone + ";'>" + d[1] + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;white-space:nowrap;'>Download</a></div>";
        }).join("") +
      "</div></section>";
    })(),

    // ── 404 ──
    "404": "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-size:clamp(80px,15vw,160px);font-weight:800;color:" + brass + ";line-height:1;margin-bottom:16px;'>404</div>" +
      "<h1 style='font-size:clamp(24px,4vw,36px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Page not found</h1>" +
      "<p style='font-size:17px;color:" + text + ";max-width:400px;margin:0 auto 32px;line-height:1.7;'>The page you are looking for does not exist or has been moved.</p>" +
      "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Back to homepage</a>" +
    "</section>",

  };

  var ap = activePage.toLowerCase();
  var body = sections[ap] 
    || sections[ap.replace(/-\d+$/, "")] 
    || sections[ap.split("-")[0]]
    || sections[ap.replace(/[^a-z]/g, "")]
    || sections.home;

  var navItems = (brief.pages || ["Home","About","Services","Contact"]).map(function(p) { return typeof p === "string" ? p : (p.label || p.name || p); }).slice(0,6);

  return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>" + (brief.brandName || "Preview") + "</title>" +
    "<link href='" + fontUrl + "' rel='stylesheet'>" +
    "<style>" +
      "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}" +
      "body{font-family:'Inter',system-ui,sans-serif;font-size:17px;line-height:1.65;background:" + bone + ";color:" + text + ";}" +
      "img{max-width:100%;}section{width:100%;}" +
      "#mobile-nav{display:none;}" +
      "@media(max-width:768px){" +
        ".nav-links{display:none !important;}" +
        ".hamburger{display:flex !important;}" +
        "#mobile-nav.open{display:block !important;}" +
        // Section padding — catch all patterns including clamp() values
        "section{padding:44px 20px !important;}" +
        // Kill inner div horizontal padding so content isn't double-indented
        "section > div{padding-left:0 !important;padding-right:0 !important;}" +
        // Grid: force single column
        "[style*='grid-template-columns']{grid-template-columns:1fr !important;gap:16px !important;}" +
        // Flex rows that should stack
        "[style*='display:flex'][style*='gap:48px'],[style*='display:flex'][style*='gap:64px'],[style*='display:flex'][style*='gap:80px']{flex-direction:column !important;gap:20px !important;}" +
        "[style*='display:flex'][style*='gap:40px']{flex-direction:column !important;gap:16px !important;}" +
        // Image placeholders — cap height so they don't eat the whole screen
        "[style*='aspect-ratio:16/9']{aspect-ratio:unset !important;height:180px !important;}" +
        "[style*='aspect-ratio:4/3']{aspect-ratio:unset !important;height:180px !important;}" +
        "[style*='aspect-ratio:3/4']{aspect-ratio:unset !important;height:200px !important;}" +
        "[style*='aspect-ratio:1']{aspect-ratio:unset !important;height:160px !important;}" +
        // Spacers — halve them all
        "div[style='height:120px']{height:40px !important;}" +
        "div[style='height:112px']{height:36px !important;}" +
        "div[style='height:96px']{height:32px !important;}" +
        "div[style='height:88px']{height:28px !important;}" +
        "div[style='height:80px']{height:28px !important;}" +
        "div[style='height:72px']{height:24px !important;}" +
        "div[style='height:64px']{height:20px !important;}" +
        "div[style='height:56px']{height:16px !important;}" +
        "div[style='height:48px']{height:16px !important;}" +
        "div[style='height:40px']{height:14px !important;}" +
        "div[style='height:32px']{height:12px !important;}" +
        "div[style='height:28px']{height:10px !important;}" +
        "div[style='height:24px']{height:8px !important;}" +
        // Headings
        "h1{font-size:clamp(26px,7vw,38px) !important;line-height:1.15 !important;}" +
        "h2{font-size:clamp(22px,6vw,30px) !important;}" +
        "h3{font-size:17px !important;}" +
        // Buttons full width on mobile
        "a[style*='padding:14px'],a[style*='padding:16px']{display:block !important;text-align:center !important;width:100% !important;box-sizing:border-box !important;}" +
        // Min-height sections (heroes) — less tall on mobile
        "[style*='min-height:80vh'],[style*='min-height:70vh']{min-height:50vh !important;}" +
        // Footer
        "footer{padding:32px 20px !important;}" +
        "footer > div{flex-direction:column !important;gap:16px !important;}" +
      "}" +
    "</style>" +
    "</head><body>" +
    "<nav style='background:" + ink + ";padding:14px clamp(20px,5vw,60px);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;'>" +
      "<div style='font-family:Inter,sans-serif;font-weight:800;font-size:18px;color:" + warmWhite + ";'>" + (brief.brandName || "Brand") + "</div>" +
      "<div class='nav-links' style='display:flex;gap:24px;align-items:center;'>" +
        navItems.map(function(l) { return "<a style='color:" + warmWhite + ";text-decoration:none;font-size:14px;font-weight:500;'>" + l + "</a>"; }).join("") +
        "<a style='padding:8px 20px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;text-decoration:none;border-radius:4px;margin-left:8px;'>" + (brief.headerCta || "Get in touch") + "</a>" +
      "</div>" +
      "<button class='hamburger' onclick='toggleMobileNav()' style='display:none;background:none;border:none;cursor:pointer;padding:4px;'>" +
        "<svg id='ham-icon' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='" + warmWhite + "' stroke-width='2' stroke-linecap='round'>" +
          "<line x1='3' y1='6' x2='21' y2='6'/><line x1='3' y1='12' x2='21' y2='12'/><line x1='3' y1='18' x2='21' y2='18'/>" +
        "</svg>" +
        "<svg id='close-icon' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='" + warmWhite + "' stroke-width='2' stroke-linecap='round' style='display:none;'>" +
          "<line x1='4' y1='4' x2='20' y2='20'/><line x1='20' y1='4' x2='4' y2='20'/>" +
        "</svg>" +
      "</button>" +
    "</nav>" +
    "<div id='mobile-nav' style='background:" + ink + ";border-top:1px solid rgba(255,255,255,.1);'>" +
      "<div style='padding:8px 20px 20px;display:flex;flex-direction:column;gap:0;'>" +
        navItems.map(function(l) { return "<a style='color:" + warmWhite + ";text-decoration:none;font-size:16px;font-weight:500;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07);display:block;'>" + l + "</a>"; }).join("") +
        "<a style='margin-top:16px;padding:14px 20px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:4px;text-align:center;display:block;'>" + (brief.headerCta || "Get in touch") + "</a>" +
      "</div>" +
    "</div>" +
    body +
    "<footer style='background:" + ink + ";padding:48px clamp(20px,5vw,60px);'>" +
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:32px;'>" +
        "<div><div style='font-family:Inter,sans-serif;font-weight:800;font-size:18px;color:" + warmWhite + ";margin-bottom:8px;'>" + (brief.brandName || "Brand") + "</div>" +
        "<div style='font-size:13px;color:" + stone + ";'>" + (brief.tagline || "") + "</div></div>" +
        "<div style='display:flex;gap:20px;flex-wrap:wrap;'>" + navItems.map(function(l) { return "<a style='color:" + stone + ";text-decoration:none;font-size:13px;'>" + l + "</a>"; }).join("") + "</div>" +
        "<div style='font-size:13px;color:" + stone + ";'>" + (brief.contactEmail || "") + "</div>" +
      "</div>" +
    "</footer>" +
    "<script>" +
      "function toggleMobileNav(){" +
        "var nav=document.getElementById('mobile-nav');" +
        "var ham=document.getElementById('ham-icon');" +
        "var cls=document.getElementById('close-icon');" +
        "var open=nav.classList.toggle('open');" +
        "ham.style.display=open?'none':'block';" +
        "cls.style.display=open?'block':'none';" +
      "}" +
      // Mobile padding catch-all — fires after render, catches clamp() values CSS can't target
      "if(window.innerWidth<=768){" +
        "document.querySelectorAll('section').forEach(function(el){" +
          "el.style.paddingTop='44px';" +
          "el.style.paddingBottom='44px';" +
          "el.style.paddingLeft='20px';" +
          "el.style.paddingRight='20px';" +
        "});" +
        "document.querySelectorAll('section > div').forEach(function(el){" +
          "el.style.paddingLeft='0';" +
          "el.style.paddingRight='0';" +
        "});" +
      "}" +
    "</script>" +
    "</body></html>";
}

// ─── Styles ───────────────────────────────────────────────────────────────────
var T = {
  surface: { background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "20px", boxSizing: "border-box", overflow: "visible", width: "100%" },
  label: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "8px", display: "block" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "14px", color: "#09090b", outline: "none", background: "#fff" },
  btnPrimary: { padding: "12px 24px", background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" },
  btnGhost: { padding: "10px 16px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  stepNum: function(active, done) { return { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, background: done ? "#b45309" : active ? "#b45309" : "#eeedf1", color: done || active ? "#fff" : "#9ca3af", flexShrink: 0 }; },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomBuild() {
  const [brief, setBrief]               = useState(null);
  const [briefName, setBriefName]       = useState("");
  const [briefError, setBriefError]     = useState("");
  const [clientName, setClientName]     = useState("");
  const [showIntake, setShowIntake]     = useState(false);
  const downloadIntakeForm = () => {
    const b64 = "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";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Spec_Client_Intake_Form.docx";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const [showBriefReview, setShowBriefReview] = useState(false);
  const [parsedBriefDraft, setParsedBriefDraft] = useState(null);
  const [draftsView, setDraftsView]     = useState(false); // start in build mode, not drafts list
  const [drafts, setDrafts]             = useState([]); // saved blueprint drafts
  const [inspoUrls, setInspoUrls]       = useState([""]);
  const [crawlResults, setCrawlResults] = useState({});  // keyed by URL
  const [crawling, setCrawling]         = useState({});  // keyed by URL
  const [storedPatterns, setStoredPatterns] = useState({}); // persisted across sessions
  const [selectedPages, setPages]       = useState(["home"]);
  const [customPages, setCustomPages]   = useState([]); // user-added pages beyond the defaults
  const [showAddPage, setShowAddPage]   = useState(false); // add page dropdown open
  const [copyBriefOnly, setCopy]        = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [generated, setGenerated]       = useState(null);
  const [draftedFields, setDraftedFields] = useState(null); // pending AI drafts for approval
  const [previewPage, setPreviewPage]   = useState("home");
  const [layoutVariants, setLayoutVariants] = useState({}); // {pageId: "A"|"B"}
  const [swapDrawer, setSwapDrawer]         = useState(null); // pageId of page being swapped, or null
  const [sectionLibrary, setSectionLibrary] = useState([]); // saved sections from past builds
  const [swapFilter, setSwapFilter]         = useState(""); // filter by page type
  const [pageOverrides, setPageOverrides]   = useState({}); // {pageId: {sectionIndex: sectionData}}
  const [mobilePreview, setMobilePreview]   = useState(false); // desktop vs mobile preview toggle
  const fileRef = useRef();
  const [parsing, setParsing]           = useState(false);
  const canGenerate = !!brief && selectedPages.length > 0;

  // ── Draft persistence ──────────────────────────────────────────────────────
  // Load saved draft on mount
  useEffect(() => {
    async function loadDraft() {
      
      try {
        const result = await kvStorageGet("spec-blueprint-draft");
        if (!result || !result.value) return;
        const draft = JSON.parse(result.value);
        if (draft.brief)          setBrief(draft.brief);
        if (draft.briefName)      setBriefName(draft.briefName);
        if (draft.clientName)     setClientName(draft.clientName);
        if (draft.inspoUrls)      setInspoUrls(draft.inspoUrls);
        if (draft.selectedPages)  setPages(draft.selectedPages);
        if (draft.customPages)    setCustomPages(draft.customPages);
        if (draft.copyBriefOnly !== undefined) setCopy(draft.copyBriefOnly);
        if (draft.layoutVariants) setLayoutVariants(draft.layoutVariants);
        if (draft.generated)      setGenerated(draft.generated);
        if (draft.previewPage)    setPreviewPage(draft.previewPage);
        if (draft.crawlResults)   setCrawlResults(draft.crawlResults);
      } catch(e) {}
    }
    loadDraft();
  }, []);

  // Save draft whenever key state changes (debounced)
  useEffect(() => {
    
    const timer = setTimeout(() => {
      const draft = {
        brief,
        briefName,
        clientName,
        inspoUrls,
        selectedPages,
        customPages,
        copyBriefOnly,
        layoutVariants,
        previewPage,
        crawlResults,
        // generated pages can be large — only save metadata, not full JSON
        generated: generated ? {
          ...generated,
          pages: generated.pages.map(p => ({
            id: p.id,
            label: p.label,
            recommended: p.recommended,
            hasVariants: p.hasVariants,
            // store full data so preview and download work on return
            data: p.data,
            variantA: p.variantA,
            variantB: p.variantB,
          }))
        } : null,
      };
      kvStorageSet("spec-blueprint-draft", JSON.stringify(draft)).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [brief, briefName, clientName, inspoUrls, selectedPages, copyBriefOnly, layoutVariants, previewPage, crawlResults, generated]);

  // Load saved drafts list on mount
  useEffect(() => {
    async function loadDrafts() {
      try {
        const result = await kvStorageGet("spec-blueprint-drafts");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (Array.isArray(parsed)) setDrafts(parsed);
        }
      } catch(e) {}
    }
    loadDrafts();
  }, []);

  async function saveDraftToList(draftState) {
    try {
      const existing = await kvStorageGet("spec-blueprint-drafts");
      let list = [];
      if (existing && existing.value) {
        try { list = JSON.parse(existing.value); } catch(e) {}
      }
      const id = "draft-" + Date.now();
      const entry = {
        id,
        clientName: draftState.clientName || draftState.brief?.brandName || "Unnamed",
        date: new Date().toISOString().slice(0, 10),
        pages: draftState.selectedPages || [],
        colors: draftState.brief?.colors || {},
        hasGenerated: !!draftState.generated,
        state: draftState,
      };
      // Replace existing draft for same client today
      const deduped = list.filter(d => !(d.clientName === entry.clientName && d.date === entry.date));
      deduped.unshift(entry);
      if (deduped.length > 20) deduped.length = 20;
      await kvStorageSet("spec-blueprint-drafts", JSON.stringify(deduped));
      setDrafts(deduped);
    } catch(e) {}
  }

  async function resumeDraft(draft) {
    const s = draft.state;
    if (s.brief) setBrief(s.brief);
    if (s.briefName) setBriefName(s.briefName);
    if (s.clientName) setClientName(s.clientName);
    if (s.inspoUrls) setInspoUrls(s.inspoUrls);
    if (s.selectedPages) setPages(s.selectedPages);
    if (s.copyBriefOnly !== undefined) setCopy(s.copyBriefOnly);
    if (s.layoutVariants) setLayoutVariants(s.layoutVariants);
    if (s.generated) setGenerated(s.generated);
    if (s.previewPage) setPreviewPage(s.previewPage);
    if (s.crawlResults) setCrawlResults(s.crawlResults);
    setDraftsView(false);
  }

  async function deleteDraft(id) {
    try {
      const updated = drafts.filter(d => d.id !== id);
      await kvStorageSet("spec-blueprint-drafts", JSON.stringify(updated));
      setDrafts(updated);
    } catch(e) {}
  }
  useEffect(() => {
    async function loadPatterns() {
      try {
        const result = await kvStorageGet("spec-inspo-patterns");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          // Handle both old per-page format and new flat pool format
          setStoredPatterns(parsed.pool ? { pool: parsed.pool } : parsed);
        }
      } catch (e) {
        // No stored patterns yet
      }
    }
    loadPatterns();
  }, []);

  // Load section library for swap drawer
  useEffect(() => {
    async function loadSectionLibrary() {
      
      try {
        const result = await kvStorageGet("spec-section-library");
        if (result && result.value) setSectionLibrary(JSON.parse(result.value));
      } catch(e) {}
    }
    loadSectionLibrary();
  }, []);

  function handleFile(file) {
    if (!file) return;
    setBriefError("");
    // 20MB max — prevents browser freeze on huge files
    if (file.size > 20 * 1024 * 1024) {
      setBriefError("File is too large. Maximum size is 20MB.");
      return;
    }
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "json") {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const raw = JSON.parse(e.target.result);
          const parsed = extractBrief(raw);
          setBriefName(file.name);
          if (parsed.brandName) setClientName(parsed.brandName);
          setParsedBriefDraft(parsed);
          setShowBriefReview(true);
          if (raw.sitemap) setPages(raw.sitemap.map(s => s.pageId));
        } catch { setBriefError("Could not parse this JSON file."); }
      };
      reader.readAsText(file);
    } else if (ext === "pdf") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: base64, type: "pdf", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBriefName(file.name); setBriefError("");
          if (data.brandName) setClientName(data.brandName);
          setParsedBriefDraft(data); setShowBriefReview(true);
        } catch (err) { setBriefError("Could not parse the PDF: " + err.message); }
        finally { setParsing(false); }
      };
      reader.readAsDataURL(file);
    } else if (ext === "docx" || ext === "doc") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: base64, type: "docx", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBriefName(file.name); setBriefError("");
          if (data.brandName) setClientName(data.brandName);
          setParsedBriefDraft(data); setShowBriefReview(true);
        } catch (err) { setBriefError("Could not parse the Word doc: " + err.message); }
        finally { setParsing(false); }
      };
      reader.readAsDataURL(file);
    } else if (ext === "txt") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const res = await fetch("/api/parse-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: e.target.result, type: "text", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBriefName(file.name); setBriefError("");
          if (data.brandName) setClientName(data.brandName);
          setParsedBriefDraft(data); setShowBriefReview(true);
        } catch (err) { setBriefError("Could not parse the file: " + err.message); }
        finally { setParsing(false); }
      };
      reader.readAsText(file);
    } else {
      setBriefError("Unsupported file type. Upload a PDF, JSON, DOCX, or TXT file.");
    }
  }

  function extractBrief(raw) {
    if (raw.designSystem && raw.brandBrief) {
      const colors = {};
      (raw.designSystem.colors || []).forEach(c => { colors[c.id] = c.hex; });
      const pages = raw.pages || [];
      const getField = (pageId, sectionType, fieldKey) => {
        const page = pages.find(p => p.pageId === pageId);
        if (!page) return "";
        const sec = page.sections?.find(s => s.sectionType === sectionType || s.captureAs === sectionType);
        if (!sec) return "";
        const fld = sec.fields?.find(f => f.key === fieldKey);
        return Array.isArray(fld?.value) ? fld.value.join(" · ") : fld?.value || "";
      };
      return {
        brandName: raw.project?.name || "",
        colors,
        fonts: raw.designSystem.fonts?.map(f => f.family) || ["Inter"],
        heroHeadline: getField("home","hero-dark","h1") || getField("home","hero","h1"),
        heroSubhead: getField("home","hero-dark","subhead"),
        heroCta1: (getField("home","hero-dark","buttons")||"").split("·")[0]?.trim() || "See the work",
        heroCta2: (getField("home","hero-dark","buttons")||"").split("·")[1]?.trim() || "See pricing",
        hookStatement: getField("home","statement-hook","statement"),
        serviceCards: pages.find(p=>p.pageId==="home")?.sections?.find(s=>s.captureAs==="card-grid-4")?.fields?.map(f=>[f.role.replace(/Card \d+ ?·? ?/,""),f.value])||[],
        differenceEyebrow: getField("home","eyebrow-heading-body","eyebrow"),
        differenceH2: getField("home","eyebrow-heading-body","h2"),
        differenceBody: getField("home","eyebrow-heading-body","body"),
        whoEyebrow: getField("home","who-section","eyebrow"),
        whoH2: getField("home","who-section","h2"),
        whoBody: getField("home","who-section","body"),
        workH2: getField("home","media-grid-link","h2"),
        pricingH2: getField("home","pricing-teaser","h2"),
        pricingSubhead: getField("home","pricing-teaser","body"),
        pricingCta: (getField("home","pricing-teaser","button")||"").split("·")[0]?.trim()||"See packages",
        tagline: raw.brandBrief?.tagline?.value||"",
        signatureLine: raw.brandBrief?.signatureLine?.value||"",
        closingCta: (getField("home","cta-pullquote-dark","button")||"").split("·")[0]?.trim()||"Start a project",
        aboutH1: getField("about","page-header","h1"),
        aboutStory: getField("about","story-block","story"),
        whyOneMaker: getField("about","eyebrow-heading-body","body"),
        founderValues: (getField("about","values-row","values")||"").split("·").map(v=>v.trim()).filter(Boolean),
        processH1: getField("process","page-header","h1"),
        processSteps: (raw.pages?.find(p=>p.pageId==="process")?.sections?.find(s=>s.captureAs==="numbered-steps")?.fields||[]).map(f=>[f.key,f.role,f.value]),
        contactH1: getField("contact","page-header","h1"),
        contactIntro: getField("contact","page-header","intro"),
        contactCta: getField("contact","contact-form","submit"),
        contactReassurance: getField("contact","contact-form","reassurance"),
        pricingTiers: (raw.pricing?.tiers||[]).map(t=>[t.name,t.subtitle||"",t.desc,t.price]),
      };
    }
    // Extract colors from text-based briefs (DOCX/TXT)
    var textColors = {};
    var rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    var hexMatches = rawStr.match(/#[0-9A-Fa-f]{6}/g) || [];
    if (hexMatches.length > 0) {
      // Map common color roles by order of appearance in intake form
      var colorNames = ["ink", "accent", "brass-deep", "bone", "asphalt", "stone", "warm-white", "text"];
      hexMatches.slice(0, 8).forEach(function(hex, i) {
        if (i < colorNames.length) textColors[colorNames[i]] = hex;
      });
      // Also try to detect by context
      var lowerStr = rawStr.toLowerCase();
      hexMatches.forEach(function(hex) {
        var idx = lowerStr.indexOf(hex.toLowerCase());
        var context = lowerStr.substring(Math.max(0, idx - 60), idx).toLowerCase();
        if (context.indexOf("amber") !== -1 || context.indexOf("accent") !== -1 || context.indexOf("primary accent") !== -1) textColors.brass = hex;
        if (context.indexOf("charcoal") !== -1 || context.indexOf("primary text") !== -1 || context.indexOf("ink") !== -1) textColors.ink = hex;
        if (context.indexOf("canvas") !== -1 || context.indexOf("background") !== -1 || context.indexOf("bone") !== -1) textColors.bone = hex;
        if (context.indexOf("stone") !== -1 || context.indexOf("secondary") !== -1 || context.indexOf("warm stone") !== -1) textColors.stone = hex;
        if (context.indexOf("border") !== -1 || context.indexOf("divider") !== -1) textColors.border = hex;
        if (context.indexOf("white") !== -1 || context.indexOf("clean") !== -1) textColors["warm-white"] = hex;
      });
    }
    return { brandName: raw.brandName||raw.name||"", colors: Object.keys(textColors).length > 0 ? textColors : (raw.colors||{}), ...raw };
  }

  function addUrl() { setInspoUrls(u => [...u, ""]); }
  function updateUrl(i, v) { setInspoUrls(u => u.map((x, j) => j === i ? v : x)); }
  function removeUrl(i) {
    const url = inspoUrls[i];
    setInspoUrls(u => u.filter((_, j) => j !== i));
    setCrawlResults(r => { const n = {...r}; delete n[url]; return n; });
  }

  async function crawlUrl(url) {
    const trimmed = url.trim();
    if (!trimmed || crawlResults[trimmed] || crawling[trimmed]) return;
    // Only allow http/https — reject javascript:, file://, ftp://, etc.
    if (!/^https?:\/\//i.test(trimmed)) return;
    setCrawling(c => ({ ...c, [trimmed]: true }));
    try {
      const res = await fetch("/api/crawl-inspo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setCrawlResults(r => {
          const updated = { ...r, [trimmed]: data };
          // Persist the merged pattern pool to storage
          if (data.patterns) {
            const merged = buildInspoContext(updated, storedPatterns);
            kvStorageSet("spec-inspo-patterns", JSON.stringify({ pool: merged })).catch(() => {});
            setStoredPatterns({ pool: merged });
          }
          return updated;
        });
      } else {
        setCrawlResults(r => ({ ...r, [trimmed]: { error: data.error || "Could not crawl this URL" } }));
      }
    } catch (err) {
      setCrawlResults(r => ({ ...r, [trimmed]: { error: err.message } }));
    } finally {
      setCrawling(c => { const n = {...c}; delete n[trimmed]; return n; });
    }
  }
  function togglePage(id) { setPages(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]); }

  async function generate() {
    if (!canGenerate) return;
    setGenerating(true);
    setGeneratingStatus("Building pages...");
    
    try {
      // Step 1: build shared inspo pool
      const inspoContext = buildInspoContext(crawlResults, storedPatterns);
      let workingBrief = { ...brief };
      let aiRecs = {};

      // Step 2: draft copy (skip if brief-only or no API)
      if (!copyBriefOnly) {
        setGeneratingStatus("Preparing content...");
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 4000);
          const res = await fetch("/api/draft-copy", {
            signal: controller.signal,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brief, positioning: { valueProposition: brief.valueProposition || "", targetAudience: brief.targetAudience || "" } }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.drafts) {
              Object.keys(data.drafts).forEach(key => {
                if (!workingBrief[key] || workingBrief[key].trim() === "") workingBrief[key] = data.drafts[key];
              });
            }
          }
        } catch(e) { /* API not available — continue */ }
      }

      // Step 3: analyze inspo (skip if no inspo or no API)
      const hasInspo = inspoContext && inspoContext.length > 20;
      if (hasInspo) {
        setGeneratingStatus("Analyzing inspo patterns...");
        try {
          const controller2 = new AbortController();
          setTimeout(() => controller2.abort(), 4000);
          const res = await fetch("/api/analyze-inspo", {
            signal: controller2.signal,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patterns: inspoContext, pages: selectedPages }),
          });
          if (res.ok) {
            const data = await res.json();
            aiRecs = data.recommendations || {};
          }
        } catch(e) { /* API not available — continue */ }
      }

      // Step 4: build pages — this is all client-side, always works
      setGeneratingStatus("Building pages...");
      await new Promise(r => setTimeout(r, 200));

      const pages = generatePages(workingBrief, selectedPages, inspoContext, aiRecs, customPages);
      const variants = {};
      pages.forEach(p => { variants[p.id] = p.recommended || "A"; });
      setLayoutVariants(variants);
      setGenerated({ pages, inspoContext, aiRecs });
      setPreviewPage(selectedPages[0] || "home");
      setDraftsView(false);

      // Save draft
      saveDraftToList({ brief: workingBrief, briefName, clientName, inspoUrls, selectedPages, copyBriefOnly, layoutVariants: variants, generated: { pages, inspoContext, aiRecs }, previewPage: selectedPages[0] || "home", crawlResults });

    } catch(genErr) {
      console.error("Generate error:", genErr);
      // Even if something fails, try to build basic pages
      try {
        const pages = generatePages(brief, selectedPages, "", {}, customPages);
        setGenerated({ pages, inspoContext: "", aiRecs: {} });
        setPreviewPage(selectedPages[0] || "home");
        setDraftsView(false);
      } catch(e2) { console.error("Fallback generate error:", e2); }
    } finally {
      setGenerating(false);
      setGeneratingStatus("");
    }
  }

  function downloadHeader() {
    if (!brief) return;
    const colors = brief.colors || {};
    const inspoContext = buildInspoContext(crawlResults, storedPatterns);
    const data = buildHeaderJSON(colors, brief, inspoContext);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = slugify(clientName || brief?.brandName) + "-header.json";
    a.click(); URL.revokeObjectURL(a.href);
  }

  function downloadFooter() {
    if (!brief) return;
    const colors = brief.colors || {};
    const inspoContext = buildInspoContext(crawlResults, storedPatterns);
    const data = buildFooterJSON(colors, brief, inspoContext);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = slugify(clientName || brief?.brandName) + "-footer.json";
    a.click(); URL.revokeObjectURL(a.href);
  }

  function slugify(name) {
    return (name || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function getPageData(p) {
    var variant = layoutVariants[p.id] || "A";
    var baseData = variant === "B" && p.variantB ? p.variantB : p.variantA || p.data;
    // Apply any section overrides for this page
    var overrides = pageOverrides[p.id];
    if (!overrides || Object.keys(overrides).length === 0) return baseData;
    var content = (baseData.content || []).slice();
    Object.keys(overrides).forEach(function(idx) {
      content.push(overrides[idx]); // append swapped sections
    });
    return { ...baseData, content: content };
  }

  function downloadPage(p) {
    const blob = new Blob([JSON.stringify(getPageData(p), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = slugify(clientName || brief?.brandName) + "-" + p.id + ".json";
    a.click(); URL.revokeObjectURL(a.href);
    // Auto-save this single page to the library
    if (brief && generated) {
      saveToLibrary(brief, [p], layoutVariants, layoutVariants);
    }
  }

  function downloadAll() {
    if (!generated) return;
    generated.pages.forEach((p, i) => setTimeout(() => {
      const blob = new Blob([JSON.stringify(getPageData(p), null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = slugify(clientName || brief?.brandName) + "-" + p.id + ".json";
      a.click(); URL.revokeObjectURL(a.href);
    }, i * 300));
    // Auto-save full build to library
    if (brief && generated) {
      saveToLibrary(brief, generated.pages, layoutVariants, layoutVariants);
    }
  }

  const steps = [
    { n: 1, label: "Brand Brief",   done: !!brief },
    { n: 2, label: "Inspo URLs",    done: inspoUrls.some(u => u.trim()) },
    { n: 3, label: "Pages",         done: selectedPages.length > 0 },
    { n: 4, label: "Copy Settings", done: true },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#eeedf1", fontFamily: "'Be Vietnam Pro', sans-serif", boxSizing: "border-box" }}>
      {showBriefReview && parsedBriefDraft && (
        <BriefReview
          parsed={parsedBriefDraft}
          onClose={() => { setShowBriefReview(false); setParsedBriefDraft(null); }}
          onConfirm={(confirmed) => {
            setBrief(confirmed);
            if (confirmed.brandName) setClientName(confirmed.brandName);
            setShowBriefReview(false);
            setParsedBriefDraft(null);
            setDraftsView(false);
          }}
        />
      )}

      {showIntake && (
        <IntakeForm
          onClose={() => setShowIntake(false)}
          onComplete={(builtBrief, name) => {
            setBrief(builtBrief);
            setBriefName("Intake form");
            setClientName(name || builtBrief.brandName || "");
            setShowIntake(false);
            setDraftsView(false);
          }}
        />
      )}

      {/* Drafts view — shown on load before starting a build */}
      {draftsView && !showIntake && (
        <div style={{ padding: "clamp(20px,3vw,40px)", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>Blueprint builds</div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Resume a saved build or start a new one.</div>
            </div>
            <button
              onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({}); setCustomPages([]); setDraftsView(false); }}
              style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              + New build
              </button>
              <button onClick={downloadIntakeForm} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 500, background: "#ffffff", color: "#6b635c", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Download Intake Form
            </button>
          </div>

          {drafts.length === 0 ? (
            <div style={{ border: "2px dashed #dde0e6", borderRadius: "12px", padding: "64px", textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#09090b", marginBottom: "8px" }}>No saved builds yet</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>Upload a brief or fill out the intake form to get started.</div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({}); setCustomPages([]); setDraftsView(false); }} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Start a build</button>
                <button onClick={() => { setShowIntake(true); setDraftsView(false); }} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Fill out intake form</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {/* New build card */}
              <div
                onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({}); setCustomPages([]); setDraftsView(false); }}
                style={{ border: "2px dashed #dde0e6", borderRadius: "10px", padding: "24px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "180px", gap: "8px" }}
                onMouseOver={e => e.currentTarget.style.borderColor = "#b45309"}
                onMouseOut={e => e.currentTarget.style.borderColor = "#dde0e6"}>
                <div style={{ fontSize: "24px", color: "#6b7280" }}>+</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>New build</div>
              </div>

              {drafts.map(draft => {
                const colors = draft.colors || {};
                const colorValues = Object.values(colors).filter(Boolean);
                return (
                  <div key={draft.id} style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", overflow: "hidden" }}>
                    {/* Color preview */}
                    <div style={{ height: "6px", background: colorValues.length > 0 ? `linear-gradient(to right, ${colorValues.slice(0,4).join(", ")})` : "#dde0e6" }} />
                    <div style={{ padding: "18px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>{draft.clientName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                        {draft.date} · {draft.pages.length} page{draft.pages.length !== 1 ? "s" : ""}
                        {draft.hasGenerated && <span style={{ marginLeft: "8px", fontSize: "11px", background: "#b45309", color: "#ffffff", padding: "2px 6px", borderRadius: "3px", fontWeight: 600 }}>Generated</span>}
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
                        {draft.pages.slice(0, 4).map(p => (
                          <span key={p} style={{ fontSize: "9px", padding: "3px 8px", background: "rgba(180, 83, 9, 0.1)", color: "#b45309", borderRadius: "10px", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "0.02em" }}>{(ALL_PAGES.find(pg => pg.id === p) || {}).label || p.replace(/-\d+$/, "").replace(/(^|-)(.)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase())}</span>
                        ))}
                        {draft.pages.length > 4 && <span style={{ fontSize: "11px", color: "#9ca3af" }}>+{draft.pages.length - 4}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => resumeDraft(draft)}
                          style={{ flex: 1, padding: "8px 0", fontSize: "12px", fontWeight: 600, background: "#6b635c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                          Resume
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          style={{ padding: "8px 12px", fontSize: "12px", background: "#fff", color: "#6b7280", border: "1px solid #dde0e6", borderRadius: "4px", cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!draftsView && (
      <div style={{ display: "grid", gridTemplateColumns: generated ? "520px 1fr" : "1fr", gap: "0", height: "calc(100vh - 57px)", overflow: "hidden" }}>

        <div style={{ padding: "clamp(20px,3vw,40px) clamp(16px,3vw,40px)", borderRight: generated ? "1px solid #dde0e6" : "none", overflowY: "auto", flexShrink: 0, background: "#eeedf1", height: "100%", boxSizing: "border-box" }}>
          <div style={{ maxWidth: generated ? "100%" : "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button onClick={() => setDraftsView(true)} style={{ padding: "7px 14px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>← Saved Builds</button>
            {(brief || generated) && (
              <button
                onClick={async () => {
                  setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]);
                  setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({});
                  setPreviewPage("home"); setPageOverrides({}); setCustomPages([]);
                  { try { await kvStorageDel("spec-blueprint-draft"); } catch(e) {} }
                }}
                style={{ fontSize: "12px", color: "#6b7280", background: "none", border: "1px solid #dde0e6", borderRadius: "4px", padding: "5px 10px", cursor: "pointer" }}>
                Clear draft
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "nowrap", overflowX: "auto" }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                {s.done && <span style={{ color: "#b45309", fontSize: "12px", fontWeight: 700 }}>✓</span>}
                <span style={{ fontSize: "12px", color: s.done ? "#09090b" : "#9ca3af", fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
                {i < steps.length - 1 && <span style={{ color: "#dde0e6", marginLeft: "8px" }}>·</span>}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, !!brief)}>1</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Brand Brief</div>
              {brief && <span style={{ fontSize: "12px", color: "#09090b", marginLeft: "auto" }}>✓ {briefName}</span>}
            </div>
            <div style={{ ...T.surface, border: brief ? "1px solid #dde0e6" : "1px solid #dde0e6" }}>
              {!brief ? (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    style={{ border: "2px dashed #dde0e6", borderRadius: "6px", padding: "32px", textAlign: "center", cursor: "pointer" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#000"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#dde0e6"}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>↑</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "4px" }}>Upload Brand Brief</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>PDF, DOCX, JSON, or TXT</div>
                    <input ref={fileRef} type="file" accept=".json,.pdf,.txt,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                  </div>
                  <div style={{ textAlign: "center", margin: "12px 0", fontSize: "12px", color: "#9ca3af" }}>or</div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => setShowIntake(true)}
                    style={{ padding: "12px 32px", fontSize: "13px", fontWeight: 600, background: "#b45309", border: "none", borderRadius: "8px", cursor: "pointer", color: "#ffffff" }}>
                    Fill out intake form
                  </button>
                  </div>
                  {parsing && <div style={{ marginTop: "12px", padding: "12px", background: "#ffffff", borderRadius: "6px", fontSize: "13px", color: "#09090b" }}>Reading brief — this takes a few seconds...</div>}
                  {briefError && <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>{briefError}</div>}
                </>
              ) : (
                <div style={{ width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>{brief.brandName || "Brand loaded"}</div>
                  {brief.colors && (
                    <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                      {Object.entries(brief.colors).slice(0, 8).map(([id, hex]) => (
                        <div key={id} title={id + ": " + hex} style={{ width: "24px", height: "24px", borderRadius: "4px", background: hex, border: "1px solid rgba(0,0,0,.1)" }} />
                      ))}
                    </div>
                  )}
                  <label style={{ ...T.label, marginBottom: "6px", display: "block" }}>Export name</label>
                  <input
                    style={{ ...T.input, marginBottom: "12px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="e.g. Specish Studio"
                  />
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "12px" }}>
                    Files will download as: <span style={{ color: "#09090b", fontWeight: 600 }}>{slugify(clientName || brief?.brandName)}-home.json</span>
                  </div>
                  <button style={T.btnGhost} onClick={() => { setBrief(null); setBriefName(""); setClientName(""); }}>Replace brief</button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, inspoUrls.some(u => u.trim()))}>2</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Inspo URLs</div>
              <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>Optional</span>
            </div>
            {/* Stored patterns used silently — not shown to end users */}
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                Paste a site URL and Spec will discover all pages in the nav, not just the home page. Each interior page informs the matching page type in your build.
              </div>
              {inspoUrls.map((url, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      style={{ ...T.input, flex: 1 }}
                      value={url}
                      onChange={e => updateUrl(i, e.target.value)}
                      onBlur={e => crawlUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") crawlUrl(url); }}
                      placeholder="https://example.com"
                    />
                    {inspoUrls.length > 1 && <button onClick={() => removeUrl(i)} style={{ ...T.btnGhost, padding: "10px 12px" }}>×</button>}
                  </div>
                  {/* Crawl status */}
                  {crawling[url.trim()] && (
                    <div style={{ fontSize: "12px", color: "#6b7280", padding: "8px 12px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px" }}>
                      Scanning site pages...
                    </div>
                  )}
                  {crawlResults[url.trim()] && !crawlResults[url.trim()].error && (
                    <div style={{ fontSize: "12px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px", padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#09090b", marginBottom: "6px" }}>
                        {crawlResults[url.trim()].pageCount} page{crawlResults[url.trim()].pageCount !== 1 ? "s" : ""} found
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(crawlResults[url.trim()].pages || []).map((p, pi) => (
                          <span key={pi} style={{ fontSize: "9px", padding: "3px 8px", background: "rgba(180, 83, 9, 0.1)", color: "#b45309", borderRadius: "10px", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "0.02em" }}>
                            {p.pageType !== "other" ? p.pageType : p.path}
                          </span>
                        ))}
                      </div>
                      {crawlResults[url.trim()].patterns?.siteNotes && (
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "8px", lineHeight: 1.5 }}>
                          {crawlResults[url.trim()].patterns.siteNotes}
                        </div>
                      )}
                    </div>
                  )}
                  {crawlResults[url.trim()]?.error && (
                    <div style={{ fontSize: "12px", color: "#dc2626", padding: "6px 10px", background: "#fef2f2", borderRadius: "4px" }}>
                      {crawlResults[url.trim()].error}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addUrl} style={{ ...T.btnGhost, marginTop: "4px", fontSize: "13px" }}>+ Add URL</button>
            </div>
          </div>

          {/* STEP 3 */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, selectedPages.length > 0)}>3</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Pages to Build</div>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Only checked pages are included in the export.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {ALL_PAGES.map(p => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: selectedPages.includes(p.id) ? "1px solid #b45309" : "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: selectedPages.includes(p.id) ? "#b45309" : "#09090b", background: selectedPages.includes(p.id) ? "rgba(180, 83, 9, 0.06)" : "#ffffff" }}>
                    <input type="checkbox" checked={selectedPages.includes(p.id)} onChange={() => togglePage(p.id)} style={{ accentColor: "#b45309", width: "15px", height: "15px" }} />
                    <span>{p.label}</span>
                  </label>
                ))}
                {customPages.map(p => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: selectedPages.includes(p.id) ? "1px solid #b45309" : "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: selectedPages.includes(p.id) ? "#b45309" : "#09090b", background: selectedPages.includes(p.id) ? "rgba(180, 83, 9, 0.06)" : "#ffffff" }}>
                    <input type="checkbox" checked={selectedPages.includes(p.id)} onChange={() => togglePage(p.id)} style={{ accentColor: "#b45309", width: "15px", height: "15px" }} />
                    <span style={{ flex: 1 }}>{p.label}</span>
                    <button
                      onClick={e => { e.preventDefault(); setCustomPages(prev => prev.filter(cp => cp.id !== p.id)); setPages(prev => prev.filter(pid => pid !== p.id)); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "14px", padding: "0 2px", lineHeight: 1 }}>×</button>
                  </label>
                ))}
              </div>

              {/* Add page button */}
              <div style={{ marginTop: "10px", position: "relative" }}>
                <button
                  onClick={() => setShowAddPage(!showAddPage)}
                  style={{ fontSize: "12px", color: "#6b7280", background: "#ffffff", border: "1px dashed #dde0e6", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", width: "100%" }}>
                  + Add page
                </button>
                {showAddPage && (
                  <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", marginTop: "4px", background: "#fff", border: "1px solid #dde0e6", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: "320px", overflowY: "auto" }}>
                    {ADDITIONAL_PAGE_TYPES.filter(p => !customPages.find(cp => cp.id === p.id)).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const newPage = { ...p, id: p.id + "-" + Date.now() };
                          setCustomPages(prev => [...prev, newPage]);
                          setPages(prev => [...prev, newPage.id]);
                          setShowAddPage(false);
                        }}
                        style={{ display: "block", width: "100%", padding: "10px 14px", fontSize: "13px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "#09090b", borderBottom: "1px solid #f4f4f5" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f9f9f9"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>{selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected</div>
            </div>
          </div>

          {/* STEP 4 */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, true)}>4</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Copy Settings</div>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>Use copy from brand brief only?</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ flex: 1, padding: "14px", border: copyBriefOnly ? "2px solid #b45309" : "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", textAlign: "center" }}>
                  <input type="radio" name="copy" checked={copyBriefOnly} onChange={() => setCopy(true)} style={{ display: "none" }} />
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>Yes</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Brief copy used verbatim. Nothing is changed or generated by AI.</div>
                </label>
                <label style={{ flex: 1, padding: "14px", border: !copyBriefOnly ? "2px solid #b45309" : "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", textAlign: "center" }}>
                  <input type="radio" name="copy" checked={!copyBriefOnly} onChange={() => setCopy(false)} style={{ display: "none" }} />
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>No</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>AI will fill any empty fields using the brand voice from the brief. You can review and edit every drafted field before anything exports.</div>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
          <button
            onClick={generate}
            disabled={!canGenerate || generating}
            style={{ ...T.btnPrimary, justifyContent: "center", padding: "14px 40px", fontSize: "14px", borderRadius: "8px", opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? "pointer" : "not-allowed" }}>
            {generating ? (generatingStatus || "Generating…") : "Generate " + selectedPages.length + " Page" + (selectedPages.length !== 1 ? "s" : "")}
          </button>
          </div>
          {!brief && <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>Upload a brand brief to enable generation</div>}

          {generated && (
            <div style={{ marginTop: "24px", ...T.surface }}>
              {/* AI Drafted fields approval */}
              {draftedFields && Object.keys(draftedFields).length > 0 && (
                <div style={{ marginBottom: "20px", padding: "16px", background: "#ffffff", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>
                    {Object.keys(draftedFields).length} field{Object.keys(draftedFields).length !== 1 ? "s" : ""} drafted in brand voice
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "12px" }}>Review and edit before downloading. These replaced blank fields in the brief.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {Object.entries(draftedFields).map(([key, value]) => (
                      <div key={key}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <textarea
                          value={value}
                          onChange={e => setDraftedFields(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={2}
                          style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", resize: "vertical", fontFamily: "'Be Vietnam Pro', sans-serif", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setDraftedFields(null)}
                    style={{ ...T.btnGhost, marginTop: "10px", fontSize: "12px" }}>
                    Dismiss
                  </button>
                </div>
              )}
              <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Download</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {generated.pages.map(p => (
                  <button key={p.id} onClick={() => downloadPage(p)} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                    <span>{p.label}</span><span style={{ color: "#9ca3af" }}>↓ .json</span>
                  </button>
                ))}
                {generated.pages.length > 1 && (
                  <button onClick={downloadAll} style={{ ...T.btnPrimary, justifyContent: "center", marginTop: "4px" }}>Download All Pages</button>
                )}
                <div style={{ height: "1px", background: "#dde0e6", margin: "8px 0" }} />
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>Global Templates</div>
                <button onClick={downloadHeader} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                  <span>Header</span><span style={{ color: "#9ca3af" }}>↓ .json</span>
                </button>
                <button onClick={downloadFooter} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                  <span>Footer</span><span style={{ color: "#9ca3af" }}>↓ .json</span>
                </button>
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                Import via WordPress → Templates → Saved Templates → Import Templates.
              </div>
            </div>
          )}
          </div>
        </div>

        {generated && (
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #dde0e6", background: "#fff", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600, marginRight: "4px" }}>PREVIEW</span>
              {generated.pages.map(p => {
                const cleanLabel = (p.label || p.id).replace(/-\d{5,}$/, "").replace(/(^|-)(.)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase());
                return (
                <button key={p.id}
                  onClick={() => setPreviewPage(p.id)}
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: previewPage === p.id ? "1px solid #6b635c" : "1px solid #dde0e6", borderRadius: "20px", background: previewPage === p.id ? "#6b635c" : "#fff", color: previewPage === p.id ? "#fff" : "#09090b" }}>
                  {cleanLabel}
                </button>);
              })}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowAddPage(!showAddPage)} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px dashed #dde0e6", borderRadius: "20px", background: "#fff", color: "#6b7280" }}>+ Add Page</button>
                {showAddPage && (
                  <div style={{ position: "absolute", top: "100%", left: 0, width: "280px", marginTop: "4px", background: "#fff", border: "1px solid #dde0e6", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: "320px", overflowY: "auto" }}>
                    {ADDITIONAL_PAGE_TYPES.filter(p => !selectedPages.includes(p.id) && !customPages.find(cp => cp.id === p.id)).map(p => (
                      <button key={p.id} onClick={() => { setPages(prev => [...prev, p.id]); setShowAddPage(false); if (generated) { try { const ic = generated.inspoContext || ''; const allIds = [...selectedPages, p.id]; const newPages = generatePages(brief, allIds, ic, generated.aiRecs, customPages); setGenerated(prev => ({ ...prev, pages: newPages })); setPreviewPage(p.id); } catch(e) { console.error('Add page error:', e); } } }} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left", fontSize: "13px", color: "#09090b" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f5f5f7"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}>
                        {p.label}
                      </button>
                    ))}
                    {ADDITIONAL_PAGE_TYPES.filter(p => !selectedPages.includes(p.id) && !customPages.find(cp => cp.id === p.id)).length === 0 && (
                      <div style={{ padding: "16px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>All pages added</div>
                    )}
                  </div>
                )}
              </div>
              {/* Swap sections button */}
              {sectionLibrary.length > 0 && (
                <button
                  onClick={() => { setSwapDrawer(previewPage); setSwapFilter(""); }}
                  style={{ marginLeft: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid #dde0e6", borderRadius: "20px", background: swapDrawer === previewPage ? "#6b635c" : "#fff", color: swapDrawer === previewPage ? "#fff" : "#09090b" }}>
                  Swap sections
                </button>
              )}
              {/* Desktop / Mobile toggle */}
              <div style={{ marginLeft: "auto", display: "flex", border: "1px solid #dde0e6", borderRadius: "6px", overflow: "hidden" }}>
                <button
                  onClick={() => setMobilePreview(false)}
                  title="Desktop preview"
                  style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none", background: !mobilePreview ? "#b45309" : "#fff", color: !mobilePreview ? "#fff" : "#6b7280", borderRight: "1px solid #dde0e6" }}>
                  Desktop
                </button>
                <button
                  onClick={() => setMobilePreview(true)}
                  title="Mobile preview"
                  style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none", background: mobilePreview ? "#b45309" : "#fff", color: mobilePreview ? "#fff" : "#6b7280" }}>
                  Mobile
                </button>
              </div>
              {/* Layout variant switcher */}
              {generated.pages.filter(p => p.id === previewPage && p.hasVariants).map(p => (
                <div key="switcher" style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Layout</span>
                    {["A", "B"].map(v => (
                      <button key={v}
                        onClick={() => setLayoutVariants(prev => ({ ...prev, [p.id]: v }))}
                        style={{
                          padding: "5px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          border: (layoutVariants[p.id] || p.recommended) === v ? "1px solid #000" : "1px solid #dde0e6",
                          borderRadius: "4px",
                          background: (layoutVariants[p.id] || p.recommended) === v ? "#000" : "#fff",
                          color: (layoutVariants[p.id] || p.recommended) === v ? "#fff" : "#6b7280",
                          position: "relative",
                        }}>
                        {v}
                        {v === p.recommended && (
                          <span style={{ position: "absolute", top: "-6px", right: "-6px", fontSize: "9px", background: "#C2A35B", color: "#1C1A17", borderRadius: "3px", padding: "1px 4px", fontWeight: 700, letterSpacing: "0.05em" }}>REC</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Swap drawer */}
            {swapDrawer && (
              <div style={{ position: "absolute", top: "57px", right: 0, width: "360px", height: "calc(100% - 57px)", background: "#fff", borderLeft: "1px solid #dde0e6", zIndex: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>Swap a section</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>From past builds — click to swap into this page</div>
                  </div>
                  <button onClick={() => setSwapDrawer(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
                </div>
                {/* Filter by page type */}
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #dde0e6", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["", "home", "work", "services", "about", "process", "contact"].map(f => (
                    <button key={f}
                      onClick={() => setSwapFilter(f)}
                      style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: swapFilter === f ? "1px solid #000" : "1px solid #dde0e6", borderRadius: "12px", background: swapFilter === f ? "#000" : "#fff", color: swapFilter === f ? "#fff" : "#6b7280" }}>
                      {f || "All"}
                    </button>
                  ))}
                </div>
                {/* Section list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                  {sectionLibrary
                    .filter(s => !swapFilter || s.pageId === swapFilter)
                    .slice(0, 40)
                    .map((s, i) => {
                      var colors = s.colors || {};
                      var ink = colors.ink || "#1C1A17";
                      var brass = colors.brass || "#C2A35B";
                      var bone = colors.bone || "#EDE7DB";
                      return (
                        <div key={s.id || i}
                          onClick={() => {
                            // Apply section override to current page
                            setPageOverrides(prev => {
                              var pageOverride = prev[swapDrawer] || {};
                              var sectionCount = Object.keys(pageOverride).length;
                              return { ...prev, [swapDrawer]: { ...pageOverride, [sectionCount]: s.data } };
                            });
                            setSwapDrawer(null);
                          }}
                          style={{ padding: "12px", border: "1px solid #dde0e6", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", transition: "border-color 0.15s" }}
                          onMouseOver={e => e.currentTarget.style.borderColor = "#000"}
                          onMouseOut={e => e.currentTarget.style.borderColor = "#dde0e6"}>
                          {/* Color preview bar */}
                          <div style={{ height: "6px", borderRadius: "3px", background: "linear-gradient(to right, " + ink + " 0%, " + ink + " 40%, " + brass + " 40%, " + brass + " 60%, " + bone + " 60%)", marginBottom: "8px" }} />
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#09090b", marginBottom: "2px" }}>
                            {s.client} · {s.pageLabel}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>Section {s.sectionIndex + 1} · {s.date}</div>
                          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                            {(s.tags || []).slice(0, 3).map(t => (
                              <span key={t} style={{ fontSize: "9px", padding: "3px 8px", background: "rgba(180, 83, 9, 0.1)", color: "#b45309", borderRadius: "10px", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "0.02em" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  {sectionLibrary.filter(s => !swapFilter || s.pageId === swapFilter).length === 0 && (
                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", padding: "32px 16px" }}>
                      No sections saved yet. Download a build to add sections to this library.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflow: "auto", background: mobilePreview ? "#eeedf1" : "#fff", display: "flex", justifyContent: mobilePreview ? "center" : "stretch", alignItems: mobilePreview ? "flex-start" : "stretch", padding: mobilePreview ? "24px 0" : "0" }}>
              <iframe
                srcDoc={buildPreviewHTML(brief, previewPage, layoutVariants[previewPage] || "A", generated?.inspoContext || "")}
                sandbox="allow-scripts"
                style={{
                  border: mobilePreview ? "1px solid #dde0e6" : "none",
                  borderRadius: mobilePreview ? "12px" : "0",
                  width: mobilePreview ? "390px" : "100%",
                  minHeight: mobilePreview ? "844px" : "calc(100vh - 100px)",
                  flexShrink: 0,
                  boxShadow: mobilePreview ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
                }}
                title="Site preview"
              />
            </div>
          </div>
        )}
      </div>
      )} {/* end !draftsView grid */}
    </div>
  );
}




























