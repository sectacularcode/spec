import { useState, useRef, useEffect } from "react";
import { T } from "./styles.js";

// Constants
import { ALL_PAGES, ADDITIONAL_PAGE_TYPES } from "../constants/pages.js";
import { LAYOUT_PATTERNS } from "../constants/patterns.js";

// Utils
import { kvStorageGet, kvStorageSet, kvStorageDel } from "./utils/storage.js";
import { buildInspoContext } from "./utils/inspo.js";
import { selectPatterns } from "./utils/patterns.js";
import { saveToLibrary } from "./utils/library.js";
import { extractBrief } from "./utils/extractBrief.js";
import { he } from "./utils/htmlEscape.js";

// Builders
import { buildHeaderJSON } from "./builders/headerFooter.js";
import { buildFooterJSON } from "./builders/headerFooter.js";
import { generatePages } from "./builders/generatePages.js";

// Preview
import { buildPreviewHTML } from "./preview/buildPreviewHTML.js";

// Components
import { IntakeForm } from "./components/IntakeForm.jsx";
import { BriefReview } from "./components/BriefReview.jsx";

export default function CustomBuild({ userId } = {}) {
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
  const [showAddPagePreview, setShowAddPagePreview] = useState(false); // separate state for preview header dropdown
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

  // T styles imported from ./styles.js


  // ── Draft persistence ──────────────────────────────────────────────────────
  // Load saved draft on mount
  useEffect(() => {
    async function loadDraft() {
      
      try {
        const result = await kvStorageGet("spec-blueprint-draft, userId);
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
      kvStorageSet("spec-blueprint-draft, JSON.stringify(draft, userId)).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [brief, briefName, clientName, inspoUrls, selectedPages, copyBriefOnly, layoutVariants, previewPage, crawlResults, generated]);

  // Load saved drafts list on mount
  useEffect(() => {
    async function loadDrafts() {
      try {
        const result = await kvStorageGet("spec-blueprint-drafts, userId);
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
      const existing = await kvStorageGet("spec-blueprint-drafts, userId);
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
      await kvStorageSet("spec-blueprint-drafts, JSON.stringify(deduped, userId));
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
      await kvStorageSet("spec-blueprint-drafts, JSON.stringify(updated, userId));
      setDrafts(updated);
    } catch(e) {}
  }
  useEffect(() => {
    async function loadPatterns() {
      try {
        const result = await kvStorageGet("spec-inspo-patterns, userId);
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
        const result = await kvStorageGet("spec-section-library, userId);
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
            kvStorageSet("spec-inspo-patterns, JSON.stringify({ pool: merged }, userId)).catch(() => {});
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
                  { try { await kvStorageDel("spec-blueprint-draft, userId); } catch(e) {} }
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
                <button onClick={() => setShowAddPagePreview(!showAddPagePreview)} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px dashed #dde0e6", borderRadius: "20px", background: "#fff", color: "#6b7280" }}>+ Add Page</button>
                {showAddPagePreview && (
                  <div style={{ position: "absolute", top: "100%", left: 0, width: "280px", marginTop: "4px", background: "#fff", border: "1px solid #dde0e6", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: "320px", overflowY: "auto" }}>
                    {ADDITIONAL_PAGE_TYPES.filter(p => !selectedPages.includes(p.id) && !customPages.find(cp => cp.id === p.id)).map(p => (
                      <button key={p.id} onClick={() => { setPages(prev => [...prev, p.id]); setShowAddPagePreview(false); if (generated) { try { const ic = generated.inspoContext || ''; const allIds = [...selectedPages, p.id]; const newPages = generatePages(brief, allIds, ic, generated.aiRecs, customPages); setGenerated(prev => ({ ...prev, pages: newPages })); setPreviewPage(p.id); } catch(e) { console.error('Add page error:', e); } } }} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left", fontSize: "13px", color: "#09090b" }}
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




























