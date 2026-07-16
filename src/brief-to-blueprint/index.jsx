import { useState, useRef, useEffect } from "react";
import { T } from "./styles.js";

// Constants
import { ALL_PAGES, ADDITIONAL_PAGE_TYPES } from "../constants/pages.js";

// Utils
import { listSectionLibrary } from "../utils/sectionLibrary.js";
import { getSessionDraft, saveSessionDraft, clearSessionDraft, listDraftSnapshots, saveDraftSnapshot, deleteDraftSnapshot } from "../utils/blueprintDrafts.js";
import { getInspoPatterns, saveInspoPatterns } from "../utils/inspoPatterns.js";
import { buildInspoContext } from "./utils/inspo.js";
import { saveToLibrary } from "./utils/library.js";
import { he } from "./utils/htmlEscape.js";
import { extractBrief } from "./utils/extractBrief.js";

// Builders
import { buildHeaderJSON, buildFooterJSON } from "./builders/headerFooter.js";
import { generatePages } from "./builders/generatePages.js";

// Preview
import { buildPreviewHTML } from "./preview/buildPreviewHTML.js";

// Components
import { IntakeForm } from "./components/IntakeForm.jsx";
import { BriefReview } from "./components/BriefReview.jsx";
import { BulkLocationModal } from "./components/BulkLocationModal.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import AdminPanel from "../components/AdminPanel.jsx";
import { authHeaders, formatErrorMessage } from "../utils/api.js";
import { estimateGenerationCost } from "./utils/estimateCost.js";
import { manifestToBrief, ManifestImportError } from "./importers/manifestImport.js";
import { COLOR_FIELDS } from "../utils/colorRoles.js";
import ButtonEditor from "../style-guide/components/ButtonEditor.jsx";
import { bestTextColor } from "../utils/contrast.js";

// Fixed 8-slot color model used everywhere else in Brief to Blueprint (see
// COLOR_KEYS in api/_lib/brandValidation.js and colorNames in IntakeForm.jsx) --
// keys are canonical and not user-renameable, only the hex values are
// editable here. Labels come from src/utils/colorRoles.js, the single
// source shared with Style Guide and Component Library -- this used to be
// an 8th independent hardcoded copy of the exact same mapping.

export default function CustomBuild({ userId, role } = {}) {
  const [brief, setBrief]               = useState(null);
  const [styleConflict, setStyleConflict]     = useState(null); // { savedStyle, briefColors, brandName } when both exist and differ -- pauses generate() until resolved
  const [stylePanelStatus, setStylePanelStatus] = useState(""); // brief save/load feedback text
  const [showStylePicker, setShowStylePicker] = useState(false); // "Load a saved style guide" dropdown open/closed
  const [savedStylesList, setSavedStylesList] = useState([]);    // all of this user's saved brand styles, for the picker
  const [loadingStyles, setLoadingStyles]     = useState(false);
  const [pickerError, setPickerError]         = useState(""); // set when the picker's fetch fails, distinct from "no styles saved yet"
  const [briefName, setBriefName]       = useState("");
  const [briefError, setBriefError]     = useState("");
  // Structural check Spec does itself (a labeled button with no resolvable
  // URL) -- not Manifest's own audit-trail prose, which used to render as a
  // separate tooltip here. That tooltip was removed in favor of a static
  // "review before publishing" reminder now shown alongside this box,
  // since the underlying claims it surfaced are already reviewed by
  // leadership at the brand level elsewhere -- Spec repeating that check
  // wasn't catching anything new. This one stays because it's the only
  // thing that knows which buttons are actually broken in this build.
  const [placeholderButtons, setPlaceholderButtons] = useState(null); // [{ label, section }] | null
  const [draftMsg, setDraftMsg]         = useState(""); // transient message for saved-drafts list actions
  const [clientName, setClientName]     = useState("");
  const [showIntake, setShowIntake]     = useState(false);
  const [showBulkLocation, setShowBulkLocation] = useState(false);
  const [clearingDraft, setClearingDraft]       = useState(false); // in-flight guard for Clear draft
  const [confirmDraftDeleteId, setConfirmDraftDeleteId] = useState(null); // saved draft id pending delete confirmation
  const [confirmPageRemoveId, setConfirmPageRemoveId]   = useState(null); // custom page id pending removal confirmation
  const [showUserDrawer, setShowUserDrawer] = useState(false);
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
  const [pageDownloadNames, setPageDownloadNames] = useState({}); // keyed by page.id -- optional user override for exported Elementor title + filename
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
  const [panelCollapsed, setPanelCollapsed] = useState(false); // collapse left panel for full-width preview
  const fileRef = useRef();
  const [parsing, setParsing]           = useState(false);
  const [uploadSource, setUploadSource] = useState("standard"); // "standard" | "manifest" — which JSON parser handleFile routes through
  const canGenerate = !!brief && selectedPages.length > 0;
  const isAdmin   = role === "admin";
  const isManager = role === "manager" || role === "admin";

  // T styles imported from ./styles.js


  // ── Draft persistence ──────────────────────────────────────────────────────
  // Load saved draft on mount
  useEffect(() => {
    async function loadDraft() {
      const draft = await getSessionDraft();
      if (!draft) return;
      try {
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
      } catch {}
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
            hasVariantC: p.hasVariantC,
            hasVariantD: p.hasVariantD,
            hasVariantE: p.hasVariantE,
            hasVariantF: p.hasVariantF,
            // store full data so preview and download work on return
            data: p.data,
            variantA: p.variantA,
            variantB: p.variantB,
            variantC: p.variantC,
            variantD: p.variantD,
            variantE: p.variantE,
            variantF: p.variantF,
          }))
        } : null,
      };
      saveSessionDraft(draft);
    }, 800);
    return () => clearTimeout(timer);
  }, [brief, briefName, clientName, inspoUrls, selectedPages, copyBriefOnly, layoutVariants, previewPage, crawlResults, generated]);

  // Load saved drafts list on mount
  useEffect(() => {
    async function loadDrafts() {
      const list = await listDraftSnapshots();
      setDrafts(list);
    }
    loadDrafts();
  }, []);

  async function saveDraftToList(draftState) {
    const clientName = draftState.clientName || draftState.brief?.brandName || "Unnamed";
    const today = new Date().toISOString().slice(0, 10);
    const data = {
      date: today,
      pages: draftState.selectedPages || [],
      colors: draftState.brief?.colors || {},
      hasGenerated: !!draftState.generated,
      state: draftState,
    };

    // Optimistic: replicate the server's same-client-same-day dedup
    // predicate locally (matches api/blueprint-drafts.js's own check)
    // rather than waiting on the network round trip to know whether this
    // updates an existing snapshot or inserts a new one.
    let previous;
    let tempId = null;
    setDrafts(existing => {
      previous = existing;
      const matchIndex = existing.findIndex(d => d.clientName === clientName && d.date === today);
      if (matchIndex !== -1) {
        const updated = [...existing];
        updated[matchIndex] = { ...updated[matchIndex], clientName, ...data };
        return updated;
      }
      tempId = "pending-" + Date.now();
      const withNew = [{ id: tempId, clientName, ...data }, ...existing];
      return withNew.length > 20 ? withNew.slice(0, 20) : withNew;
    });

    const result = await saveDraftSnapshot(clientName, data);
    if (!result.ok) {
      setDrafts(previous);
      setDraftMsg("Save failed: " + (result.error || "please try again."));
      setTimeout(() => setDraftMsg(""), 3500);
      return;
    }
    if (tempId) {
      // Reconcile the temporary id with the server-assigned one.
      setDrafts(existing => existing.map(d => d.id === tempId ? { ...d, id: result.id } : d));
    }
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
    let removed, index;
    setDrafts(existing => {
      index = existing.findIndex(d => d.id === id);
      removed = existing[index];
      return existing.filter(d => d.id !== id);
    });
    const result = await deleteDraftSnapshot(id);
    if (!result.ok && removed) {
      setDrafts(existing =>
        existing.some(d => d.id === id) ? existing : [...existing.slice(0, index), removed, ...existing.slice(index)]
      );
      setDraftMsg("Delete failed: " + (result.error || "please try again."));
      setTimeout(() => setDraftMsg(""), 3500);
    }
  }
  async function handleBulkLocationGenerate(locations, template) {
    if (!brief) return;
    // Generate one location page per location entry. Slugs are derived from
    // city name, so dedupe against already-added pages and within this batch
    // (e.g. two locations both named "Denver" in different states) — otherwise
    // they'd silently collide on the same URL when imported.
    const usedSlugs = new Set(customPages.map(p => p.slug));
    const newPageDefs = [];
    locations.forEach((loc, i) => {
      const pageId = "location-" + Date.now() + "-" + i;
      let baseSlug = "/" + (loc.city || "location").toLowerCase().replace(/\s+/g, "-");
      let slug = baseSlug;
      let n = 2;
      while (usedSlugs.has(slug)) { slug = baseSlug + "-" + n; n++; }
      usedSlugs.add(slug);
      newPageDefs.push({ id: pageId, label: (loc.locationName || loc.city || "Location") + (loc.state ? ", " + loc.state : ""), slug, _locationData: loc, _template: template });
    });
    setPages(prev => [...prev, ...newPageDefs.map(p => p.id)]);
    setCustomPages(prev => [...prev, ...newPageDefs]);
    // Regenerate pages if already generated
    if (generated) {
      try {
        const inspoCtx = generated.inspoContext || "";
        const newPages = generatePages(brief, [...selectedPages, ...newPageDefs.map(p => p.id)], inspoCtx, generated.aiRecs, [...customPages, ...newPageDefs]);
        setGenerated(prev => ({ ...prev, pages: newPages }));
      } catch {}
    }
  }

  useEffect(() => {
    async function loadPatterns() {
      const patterns = await getInspoPatterns();
      if (patterns.pool) setStoredPatterns(patterns);
    }
    loadPatterns();
  }, []);

  // Load section library for swap drawer
  useEffect(() => {
    async function loadSectionLibrary() {
      const entries = await listSectionLibrary();
      setSectionLibrary(entries);
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

          if (uploadSource === "manifest") {
            // Manifest's shape (brand / page.blocks[], each block tagged
            // with an elementType) is structurally different from Spec's
            // own native/flat JSON formats — it needs its own parser, not
            // extractBrief(), which would just spread the raw object onto
            // the brief with no real field mapping. No AI call here; this
            // is a deterministic, zero-token import since the data's
            // already structured on her end.
            const parsed = manifestToBrief(raw);
            setBriefName(file.name);
            if (parsed.brandName) setClientName(parsed.brandName);
            setParsedBriefDraft(parsed);
            setShowBriefReview(true);
            // A Manifest import is always a single bespoke page — "Home"
            // (the default selectedPages value) reads entirely different
            // field names than what manifestToBrief() populates, so
            // leaving the default in place silently builds an
            // empty-looking page. parsed._suggestedPid (from page.type,
            // manifestImport.js) is "landing" or "other" -- both route to
            // the same builder that actually reads brief.features/
            // faqItems/testimonials, so this never regresses to a
            // mismatched page type; see manifestImport.js for why it's
            // deliberately not the wider table Manifest suggested.
            var suggestedPid = parsed._suggestedPid || "other";
            setPages([suggestedPid]);
            if (parsed._suggestedVariant) {
              setLayoutVariants({ [suggestedPid]: parsed._suggestedVariant });
            }
            // _placeholderButtons is the one thing worth showing prominently:
            // a real "you must supply this before publishing" requirement,
            // verified structurally by Spec itself, not by parsing
            // Manifest's prose. Manifest's own audit-trail notices
            // (unmapped blocks, unverified claims) are still parsed into
            // parsed._unmappedBlocks/_manifestWarnings by manifestImport.js,
            // but no longer surfaced here -- those claims are already
            // reviewed by leadership at the brand level, so repeating that
            // check in Spec wasn't catching anything new. A static "review
            // everything before publishing" reminder covers that ground now.
            const placeholderButtons = parsed._placeholderButtons || [];
            setPlaceholderButtons(placeholderButtons.length > 0 ? placeholderButtons : null);
            return;
          }

          const parsed = extractBrief(raw);
          setBriefName(file.name);
          if (parsed.brandName) setClientName(parsed.brandName);
          setParsedBriefDraft(parsed);
          setShowBriefReview(true);
          if (raw.sitemap) setPages(raw.sitemap.map(s => s.pageId));
        } catch (err) {
          if (err instanceof ManifestImportError) {
            setBriefError("Manifest import failed (" + err.issues.length + " issue" + (err.issues.length !== 1 ? "s" : "") + "): " + err.issues.join("; "));
          } else {
            setBriefError(uploadSource === "manifest" ? "Could not import this Manifest file." : "Could not parse this JSON file.");
          }
        }
      };
      reader.readAsText(file);
    } else if (ext === "pdf") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ content: base64, type: "pdf", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) { const e = new Error(data.error || "Parsing failed"); e.detail = data.detail; throw e; }
          setBriefName(file.name); setBriefError("");
          if (data.brandName) setClientName(data.brandName);
          setParsedBriefDraft(data); setShowBriefReview(true);
        } catch (err) {
          const detailStr = err.detail
            ? "\n\n[" + err.detail.stopReason + " / " + err.detail.model + "]\n" + (err.detail.error || "") +
              (err.detail.position != null ? " (position " + err.detail.position + ")" : "") +
              (err.detail.snippet ? "\n\nNear:\n" + err.detail.snippet : "")
            : "";
          setBriefError("Could not parse the PDF: " + err.message + detailStr);
        }
        finally { setParsing(false); }
      };
      reader.readAsDataURL(file);
    } else if (ext === "docx" || ext === "doc") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ content: base64, type: "docx", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) { const e = new Error(data.error || "Parsing failed"); e.detail = data.detail; throw e; }
          setBriefName(file.name); setBriefError("");
          if (data.brandName) setClientName(data.brandName);
          setParsedBriefDraft(data); setShowBriefReview(true);
        } catch (err) {
          const detailStr = err.detail
            ? "\n\n[" + err.detail.stopReason + " / " + err.detail.model + "]\n" + (err.detail.error || "") +
              (err.detail.position != null ? " (position " + err.detail.position + ")" : "") +
              (err.detail.snippet ? "\n\nNear:\n" + err.detail.snippet : "")
            : "";
          setBriefError("Could not parse the Word doc: " + err.message + detailStr);
        }
        finally { setParsing(false); }
      };
      reader.readAsDataURL(file);
    } else if (ext === "txt") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const res = await fetch("/api/parse-brief", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ content: e.target.result, type: "text", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) { const e = new Error(data.error || "Parsing failed"); e.detail = data.detail; throw e; }
          setBriefName(file.name); setBriefError("");
          if (data.brandName) setClientName(data.brandName);
          setParsedBriefDraft(data); setShowBriefReview(true);
        } catch (err) {
          const detailStr = err.detail
            ? "\n\n[" + err.detail.stopReason + " / " + err.detail.model + "]\n" + (err.detail.error || "") +
              (err.detail.position != null ? " (position " + err.detail.position + ")" : "") +
              (err.detail.snippet ? "\n\nNear:\n" + err.detail.snippet : "")
            : "";
          setBriefError("Could not parse the file: " + err.message + detailStr);
        }
        finally { setParsing(false); }
      };
      reader.readAsText(file);
    } else {
      setBriefError("Unsupported file type. Upload a PDF, JSON, DOCX, or TXT file.");
    }
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
        headers: await authHeaders(),
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setCrawlResults(r => {
          const updated = { ...r, [trimmed]: data };
          // Persist the merged pattern pool to storage
          if (data.patterns) {
            const merged = buildInspoContext(updated, storedPatterns);
            saveInspoPatterns(merged);
            setStoredPatterns({ pool: merged });
          }
          return updated;
        });
        // Real brand colors pulled from the reference site's own Elementor
        // Kit CSS (not guessed). Only fills currently-blank color fields —
        // never overwrites a color the user already set or that came from
        // an uploaded brief doc, same "fill blanks only" rule used
        // everywhere else in this app.
        if (data.colors) {
          setBrief(b => {
            if (!b) return b;
            const existing = b.colors || {};
            const merged = { ...existing };
            let changed = false;
            for (const key of Object.keys(data.colors)) {
              if (!existing[key] && data.colors[key]) {
                merged[key] = data.colors[key];
                changed = true;
              }
            }
            return changed ? { ...b, colors: merged } : b;
          });
        }
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

  // Holds the context needed to resume generation after the user reviews/
  // edits/discards AI-drafted fields (see draftedFields review panel below).
  const pendingGenRef = useRef(null);

  // Step 3 (analyze inspo) + Step 4 (build pages) + save draft. Runs either
  // immediately (no drafts to review) or after the user approves/discards
  // the drafted-fields review panel.
  // Brand style guide — a saved color/font profile per brand name,
  // reusable across every future page for that brand regardless of
  // upload source (Standard Brief or Manifest both funnel through
  // generate() below, so this only needs to live in one place).

  async function fetchSavedStyle(brandName) {
    if (!brandName || !brandName.trim()) return null;
    try {
      const res = await fetch("/api/brands?name=" + encodeURIComponent(brandName.trim()), {
        headers: await authHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.brand || null;
    } catch (e) {
      console.warn("fetchSavedStyle failed:", e.message);
      return null;
    }
  }

  // Inline color/font editing for the loaded brief -- needed because
  // Manifest imports deliberately arrive with no colors ("that's Spec's
  // job now," per the integration doc), and previously there was no way
  // to add them once a brief was already loaded; the swatch row was
  // read-only. Initializes brief.colors/fonts if they don't exist yet
  // rather than requiring them to already be present.
  //
  // Both call regenerateAllPages() (not just the active preview page) --
  // confirmed real bug, July 2026: colors/fonts are brand-wide, but these
  // two functions were the only brief-editing paths that never refreshed
  // generated.pages at all. The live preview reads brief directly so the
  // edit looked like it took, while the actual downloadable JSON silently
  // kept whatever colors were baked in at the last "Generate" click.
  // Every other brief-editing path (section styles, skip-checklist) was
  // already wired to regenerateActivePage() when that safeguard was built;
  // these two were just missed. Full regenerateAllPages() rather than the
  // single-page regenerateActivePage() specifically because a color/font
  // change should apply to every page in the project, not only whichever
  // one happens to be in preview when the edit is made.
  function setBriefColor(key, hex) {
    var updatedBrief = { ...brief, colors: { ...(brief.colors || {}), [key]: hex } };
    setBrief(updatedBrief);
    regenerateAllPages(updatedBrief);
  }
  function setBriefFont(index, value) {
    var fonts = Array.isArray(brief.fonts) ? [...brief.fonts] : ["", ""];
    fonts[index] = value;
    var updatedBrief = { ...brief, fonts: fonts };
    setBrief(updatedBrief);
    regenerateAllPages(updatedBrief);
  }

  // ── Buttons (Primary/Secondary + free-form extras) ───────────────────
  // Same locked-slot pattern as Style Guide/Component Library's Buttons
  // card, reusing the same ButtonEditor component -- every builder across
  // Brief to Blueprint looks a button up BY NAME ("primary"/"secondary",
  // case-insensitive, see landing.js/home.js/services.js/generic.js/
  // about.js), not by array position, so those two names have to actually
  // exist. Buttons apply brand-wide (not scoped to one page type), same as
  // colors/fonts -- regenerateAllPages(), not regenerateActivePage().
  //
  // Previously the ONLY way to set brief.buttons at all was pulling a
  // saved Style Guide/Component Library style by exact brand-name match --
  // real gap for a genuinely custom, one-off build with no saved style to
  // pull from. This lets B2B edit buttons directly, the same way it
  // already edits colors directly.
  function isNamedButton(b, role) { return (b.name || "").trim().toLowerCase() === role; }

  function defaultBriefButton(role) {
    var accentHex = (brief.colors && brief.colors.brass) || "#3F3F46";
    var inkHex = (brief.colors && brief.colors.ink) || "#18181B";
    if (role === "primary") {
      return { name: "Primary", background: accentHex, textColor: bestTextColor(accentHex, "#1a1a1a") };
    }
    return { name: "Secondary", background: inkHex, textColor: "#FFFFFF" };
  }

  function setBriefButtonByName(role, updated) {
    var current = Array.isArray(brief.buttons) ? brief.buttons : [];
    var idx = current.findIndex(function (b) { return isNamedButton(b, role); });
    var named = { ...updated, name: role === "primary" ? "Primary" : "Secondary" };
    var newButtons = idx >= 0 ? current.map(function (b, i) { return i === idx ? named : b; }) : current.concat([named]);
    var updatedBrief = { ...brief, buttons: newButtons };
    setBrief(updatedBrief);
    regenerateAllPages(updatedBrief);
  }

  function addBriefButton() {
    var accentHex = (brief.colors && brief.colors.brass) || "#B45309";
    var textColor = bestTextColor(accentHex, (brief.colors && brief.colors.text) || "#1a1a1a");
    var current = Array.isArray(brief.buttons) ? brief.buttons : [];
    var updatedBrief = { ...brief, buttons: current.concat([{ name: "", background: accentHex, textColor: textColor }]) };
    setBrief(updatedBrief);
    regenerateAllPages(updatedBrief);
  }

  function updateBriefButton(index, updated) {
    var current = Array.isArray(brief.buttons) ? brief.buttons : [];
    var updatedBrief = { ...brief, buttons: current.map(function (b, i) { return i === index ? updated : b; }) };
    setBrief(updatedBrief);
    regenerateAllPages(updatedBrief);
  }

  function removeBriefButton(index) {
    var current = Array.isArray(brief.buttons) ? brief.buttons : [];
    var updatedBrief = { ...brief, buttons: current.filter(function (_, i) { return i !== index; }) };
    setBrief(updatedBrief);
    regenerateAllPages(updatedBrief);
  }

  // ── Section styles picker (landing/other pages) ──────────────────────
  // Replaces the old AFS_BRAND_ID hardcoded layout in manifestImport.js
  // with a real UI over the same brief.featureLayout/postClosingLayout
  // mechanism landing.js and buildPreviewHTML.js already both read.

  var SECTION_STYLE_LABELS = {
    "split-right": "Split image, right", "split-left": "Split image, left",
    "split-cta-right": "Split + button, right", "split-cta-left": "Split + button, left",
    "centered-cta": "Centered callout", "checklist": "Checklist",
    "video": "Video", "map-beside": "Map beside", "embedded-form": "Embedded form",
    "plain": "Plain",
  };

  function defaultRowStyle(i, hasVideo) {
    var cycle = hasVideo
      ? ["split-right", "centered-cta", "checklist", "video", "split-left", "split-cta-right", "plain"]
      : ["split-right", "centered-cta", "checklist", "split-left", "split-cta-right", "plain"];
    return cycle[i % cycle.length];
  }

  // Reads the current per-row customization back out of the brief, or
  // computes sensible defaults (matching the existing auto-cycle) if
  // nothing valid is set yet. "Valid" means every feature index 0..N-1 is
  // covered exactly once across featureLayout+postClosingLayout combined
  // -- anything else (stale data from a different feature count, a
  // half-written state) falls back to defaults rather than showing a
  // broken partial picker.
  function getSectionRows(b, featureCount) {
    var hasVideo = !!b.videoUrl;
    var entries = [];
    (b.featureLayout || []).forEach(function(e) { entries.push({ indices: e.indices || [], style: e.style, header: e.header || "", postClosing: false }); });
    (b.postClosingLayout || []).forEach(function(e) { entries.push({ indices: e.indices || [], style: e.style, header: e.header || "", postClosing: true }); });
    var seen = {};
    var valid = entries.length > 0;
    entries.forEach(function(e) {
      e.indices.forEach(function(i) {
        if (i >= featureCount || seen[i]) valid = false;
        seen[i] = true;
      });
    });
    for (var i = 0; i < featureCount; i++) { if (!seen[i]) valid = false; }
    if (valid) {
      entries.sort(function(a, c) {
        if (a.postClosing !== c.postClosing) return a.postClosing ? 1 : -1;
        return (a.indices[0] || 0) - (c.indices[0] || 0);
      });
      return entries;
    }
    var rows = [];
    for (var j = 0; j < featureCount; j++) {
      rows.push({ indices: [j], style: defaultRowStyle(j, hasVideo), header: "", postClosing: false });
    }
    return rows;
  }

  // Regenerates just the active landing page (all its variants) using
  // generatePages() scoped to a single page id -- reuses the real
  // dispatch/build logic rather than duplicating it, and costs nothing:
  // page-building has no AI call, only brief parsing/drafting do (see the
  // AI cost doc). Needed because generated.pages is a snapshot taken at
  // the last "Generate" click -- without this, a section-style edit would
  // update the live preview (which reads brief directly) but not the
  // actual downloadable JSON, so the two would silently disagree.
  function regenerateActivePage(updatedBrief) {
    if (!generated) return;
    var freshPages = generatePages(updatedBrief, [previewPage], generated.inspoContext, generated.aiRecs, customPages);
    if (!freshPages.length) return;
    var freshPage = freshPages[0];
    setGenerated(g => ({ ...g, pages: g.pages.map(p => p.id === previewPage ? freshPage : p) }));
  }

  // Same purpose as regenerateActivePage(), but for brief edits that apply
  // to the whole project rather than one page -- colors and fonts are
  // brand-wide, so scoping the refresh to just previewPage would leave
  // every other selected page silently stale on download. Also costs
  // nothing (no AI call), same as regenerateActivePage().
  function regenerateAllPages(updatedBrief) {
    if (!generated) return;
    var freshPages = generatePages(updatedBrief, selectedPages, generated.inspoContext, generated.aiRecs, customPages);
    if (!freshPages.length) return;
    setGenerated(g => ({ ...g, pages: freshPages }));
  }

  function updateSectionLayout(newRows) {
    var featureLayout = newRows.filter(function(r) { return !r.postClosing; })
      .map(function(r) { return { style: r.style, indices: r.indices, header: r.header || undefined }; });
    var postClosingLayout = newRows.filter(function(r) { return r.postClosing; })
      .map(function(r) { return { style: r.style, indices: r.indices, header: r.header || undefined }; });
    var updatedBrief = { ...brief, featureLayout: featureLayout, postClosingLayout: postClosingLayout };
    setBrief(updatedBrief);
    regenerateActivePage(updatedBrief);
  }

  function setSectionRowStyle(rows, rowIdx, style) {
    updateSectionLayout(rows.map(function(r, i) { return i === rowIdx ? { ...r, style: style } : r; }));
  }

  function setSectionRowPostClosing(rows, rowIdx, postClosing) {
    updateSectionLayout(rows.map(function(r, i) { return i === rowIdx ? { ...r, postClosing: postClosing } : r; }));
  }

  function setSectionRowHeader(rows, rowIdx, header) {
    updateSectionLayout(rows.map(function(r, i) { return i === rowIdx ? { ...r, header: header } : r; }));
  }

  // Groups row rowIdx with the next row under one shared header, or -- if
  // it's already grouped -- splits it back into individual rows with
  // default styles. Capped at 2-way grouping for now (matches the one
  // real case this replaces, AFS's "Semi Truck Repair"/"Trailer Repair"
  // pairing); a 3+ way merge would need a different UI than a single
  // "group with next" checkbox.
  function toggleGroupWithNext(rows, rowIdx) {
    var row = rows[rowIdx];
    var next = rows[rowIdx + 1];
    var hasVideo = !!brief.videoUrl;
    var newRows;
    if (row.indices.length > 1) {
      newRows = rows.slice(0, rowIdx)
        .concat(row.indices.map(function(i) { return { indices: [i], style: defaultRowStyle(i, hasVideo), header: "", postClosing: row.postClosing }; }))
        .concat(rows.slice(rowIdx + 1));
    } else if (next && next.indices.length === 1 && next.postClosing === row.postClosing) {
      var merged = { indices: row.indices.concat(next.indices), style: "grouped-header", header: "", postClosing: row.postClosing };
      newRows = rows.slice(0, rowIdx).concat([merged]).concat(rows.slice(rowIdx + 2));
    } else {
      return;
    }
    updateSectionLayout(newRows);
  }

  function toggleSkipServicesChecklist(checked) {
    var updatedBrief = { ...brief, skipServicesChecklist: checked };
    setBrief(updatedBrief);
    regenerateActivePage(updatedBrief);
  }

  function toggleSkipTrustStats(checked) {
    var updatedBrief = { ...brief, skipTrustStats: checked };
    setBrief(updatedBrief);
    regenerateActivePage(updatedBrief);
  }

  function toggleSkipFaqSection(checked) {
    var updatedBrief = { ...brief, skipFaqSection: checked };
    setBrief(updatedBrief);
    regenerateActivePage(updatedBrief);
  }

  function toggleSkipTestimonials(checked) {
    var updatedBrief = { ...brief, skipTestimonials: checked };
    setBrief(updatedBrief);
    regenerateActivePage(updatedBrief);
  }

  // Manual override for Location (Variant F)'s map/address -- Manifest is
  // the only other source for these two fields (manifestImport.js's
  // map_location handling), and Manifest doesn't always send a
  // map_location section (e.g. a service page with no location content
  // at all). Typing updates brief state immediately so the fields feel
  // responsive; the map iframe/variant regeneration itself only fires on
  // blur (commitBriefFieldEdit) rather than every keystroke, since
  // regenerating rebuilds all 6 landing variants (A-F) each time -- no
  // reason to pay that cost per character typed.
  function updateMapAddress(value) {
    setBrief(b => ({ ...b, mapAddress: value }));
  }
  function updateMapCity(value) {
    setBrief(b => ({ ...b, mapCity: value }));
  }
  // Hero eyebrow -- landing.js already reads brief.heroEyebrow (falls back
  // to brandName when unset: `brief.heroEyebrow != null ? brief.heroEyebrow
  // : brandName`), and IntakeForm.jsx already has a text box for it -- but
  // that form is a separate from-scratch client-intake flow. There was
  // never a way to edit it for an already-loaded brief (e.g. after a
  // Manifest import, which has no concept of "eyebrow" in its own schema
  // at all, so every import silently falls back to showing the brand name
  // as the eyebrow). This closes that gap the same way the address field
  // above does: writes straight to the same brief.heroEyebrow field
  // landing.js already reads, no new rendering path.
  function updateHeroEyebrow(value) {
    setBrief(b => ({ ...b, heroEyebrow: value }));
  }
  function commitBriefFieldEdit() {
    regenerateActivePage(brief);
  }

  async function saveBrandStyle() {
    var hasColors = brief && brief.colors && Object.keys(brief.colors).length > 0;
    var hasFonts = brief && Array.isArray(brief.fonts) && brief.fonts.some(function (f) { return f; });
    var hasButtons = brief && Array.isArray(brief.buttons) && brief.buttons.length > 0;
    if (!brief || !brief.brandName || !(hasColors || hasFonts || hasButtons)) return;
    setStylePanelStatus("Saving...");
    try {
      // brands is shared and keyed by id, not by name the way brand_styles
      // was -- look up whether this client already has a profile first, so
      // a re-save updates their existing row instead of either colliding
      // on the name-uniqueness check or silently minting a duplicate.
      const existing = await fetchSavedStyle(brief.brandName);
      const id = existing ? existing.id : "brand-" + Date.now();
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ id, name: brief.brandName, colors: brief.colors, fonts: brief.fonts ? { heading: brief.fonts[0], body: brief.fonts[1] } : {}, buttons: brief.buttons || [] }),
      });
      if (res.ok) {
        setStylePanelStatus("Saved as " + brief.brandName + "'s style guide.");
      } else {
        let serverMsg = "";
        try { serverMsg = (await res.json()).error || ""; } catch { /* body wasn't JSON */ }
        console.error("saveBrandStyle failed:", res.status, serverMsg);
        setStylePanelStatus(formatErrorMessage(role, res.status, serverMsg, "Couldn't save — try again."));
      }
    } catch (e) {
      console.error("saveBrandStyle errored:", e.message);
      setStylePanelStatus(formatErrorMessage(role, null, e.message, "Couldn't save — try again."));
    }
    setTimeout(() => setStylePanelStatus(""), 6000);
  }

  // "Load a saved style guide" — a user-triggered picker across every
  // saved brand, not just an exact match on the brief's current brand
  // name. Opening the picker is the "yes"; closing it without picking is
  // the "no" -- no separate confirm step needed on top of that.
  async function openStylePicker() {
    setShowStylePicker(true);
    setLoadingStyles(true);
    setPickerError("");
    try {
      const res = await fetch("/api/brands", { headers: await authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSavedStylesList(data.brands || []);
      } else {
        let serverMsg = "";
        try { serverMsg = (await res.json()).error || ""; } catch { /* body wasn't JSON */ }
        console.error("openStylePicker failed:", res.status, serverMsg);
        setSavedStylesList([]);
        setPickerError(formatErrorMessage(role, res.status, serverMsg, "Couldn't load saved styles — try again."));
      }
    } catch (e) {
      console.error("openStylePicker errored:", e.message);
      setSavedStylesList([]);
      setPickerError(formatErrorMessage(role, null, e.message, "Couldn't load saved styles — try again."));
    }
    setLoadingStyles(false);
  }


  // Applies a picked style the same way resolveStyleConflict's "use saved"
  // branch does, so both entry points behave identically.
  function applySavedStyle(style) {
    setBrief(b => ({
      ...b,
      colors: (style.colors && Object.keys(style.colors).length > 0) ? style.colors : b.colors,
      fonts: style.fonts && (style.fonts.heading || style.fonts.body)
        ? [style.fonts.heading || style.fonts.body, style.fonts.body || style.fonts.heading]
        : b.fonts,
      buttons: (Array.isArray(style.buttons) && style.buttons.length > 0) ? style.buttons : b.buttons,
    }));
    setShowStylePicker(false);
    setStylePanelStatus("Applied " + style.name + "'s style guide.");
    setTimeout(() => setStylePanelStatus(""), 3000);
  }

  // Two real, non-empty color sets disagreeing on at least one shared key
  // is a genuine conflict worth asking about — not just "one of them is
  // present." A saved style with no overlapping keys at all, or identical
  // values, resolves silently.
  function colorsConflict(a, b) {
    if (!a || !b) return false;
    const aKeys = Object.keys(a).filter(k => a[k]);
    if (aKeys.length === 0) return false;
    return aKeys.some(k => b[k] && b[k].toLowerCase() !== a[k].toLowerCase());
  }

  function resolveStyleConflict(useSaved) {
    if (!styleConflict) return;
    if (useSaved) {
      const s = styleConflict.savedStyle;
      setBrief(b => ({
        ...b,
        colors: (s.colors && Object.keys(s.colors).length > 0) ? s.colors : b.colors,
        fonts: s.fonts && (s.fonts.heading || s.fonts.body)
          ? [s.fonts.heading || s.fonts.body, s.fonts.body || s.fonts.heading]
          : b.fonts,
        buttons: (Array.isArray(s.buttons) && s.buttons.length > 0) ? s.buttons : b.buttons,
      }));
    }
    // useSaved === false leaves brief.colors exactly as the import
    // provided it -- nothing to change.
    setStyleConflict(null);
    // Deferred one tick so setBrief above has actually landed before
    // generate() reads brief.colors again.
    setTimeout(() => generate(true), 0);
  }

  async function finishGenerate(workingBrief, inspoContext) {
    setGenerating(true);
    setGeneratingStatus("Building pages...");
    try {
      let aiRecs = {};
      const hasInspo = inspoContext && inspoContext.length > 20;
      if (hasInspo) {
        setGeneratingStatus("Analyzing inspo patterns...");
        try {
          const controller2 = new AbortController();
          // Was 4s — the same too-tight timeout bug already found in the
          // draft-copy call above; matched to the same 25s here.
          setTimeout(() => controller2.abort(), 25000);
          const res = await fetch("/api/analyze-inspo", {
            signal: controller2.signal,
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ patterns: inspoContext, pages: selectedPages }),
          });
          if (res.ok) {
            const data = await res.json();
            aiRecs = data.recommendations || {};
          } else {
            console.warn("analyze-inspo request failed:", res.status);
          }
        } catch (inspoErr) {
          console.warn("analyze-inspo request errored, continuing without recommendations:", inspoErr.message);
        }
      }

      setGeneratingStatus("Building pages...");
      await new Promise(r => setTimeout(r, 200));

      const pages = generatePages(workingBrief, selectedPages, inspoContext, aiRecs, customPages);
      const variants = {};
      pages.forEach(p => { variants[p.id] = p.recommended || "A"; });
      setLayoutVariants(variants);
      setGenerated({ pages, inspoContext, aiRecs });
      setPreviewPage(selectedPages[0] || "home");
      setDraftsView(false);

      saveDraftToList({ brief: workingBrief, briefName, clientName, inspoUrls, selectedPages, copyBriefOnly, layoutVariants: variants, generated: { pages, inspoContext, aiRecs }, previewPage: selectedPages[0] || "home", crawlResults });

    } catch(genErr) {
      console.error("Generate error:", genErr);
      try {
        const pages = generatePages(workingBrief, selectedPages, "", {}, customPages);
        setGenerated({ pages, inspoContext: "", aiRecs: {} });
        setPreviewPage(selectedPages[0] || "home");
        setDraftsView(false);
      } catch(e2) { console.error("Fallback generate error:", e2); }
    } finally {
      setGenerating(false);
      setGeneratingStatus("");
      pendingGenRef.current = null;
    }
  }

  // User clicked "Approve & continue" on the drafted-fields review panel —
  // merge their (possibly edited) drafts into the brief and proceed.
  function approveDraftedFields() {
    const pending = pendingGenRef.current;
    if (!pending) { setDraftedFields(null); return; }
    const workingBrief = { ...pending.briefBase, ...draftedFields };
    setDraftedFields(null);
    finishGenerate(workingBrief, pending.inspoContext);
  }

  // User clicked "Discard" — continue with the brief exactly as written,
  // none of the AI-suggested fields are applied.
  function discardDraftedFields() {
    const pending = pendingGenRef.current;
    setDraftedFields(null);
    if (!pending) return;
    finishGenerate(pending.briefBase, pending.inspoContext);
  }

  async function generate(skipStyleCheck) {
    if (!canGenerate) return;

    // Check for a saved style guide before anything else -- if it
    // conflicts with colors already on the brief (from either upload
    // path), pause and let the person choose rather than silently picking
    // one. A non-conflicting saved style (brief has no colors of its own,
    // or the values already match) applies automatically with no prompt.
    // skipStyleCheck is set by resolveStyleConflict() below, once the
    // person has already made that choice for this generation attempt --
    // without it, re-calling generate() would immediately re-detect the
    // same conflict and re-prompt in a loop.
    if (!skipStyleCheck) {
      const savedStyle = await fetchSavedStyle(brief.brandName);
      if (savedStyle && savedStyle.colors && colorsConflict(brief.colors, savedStyle.colors)) {
        setStyleConflict({ savedStyle, briefColors: brief.colors, brandName: brief.brandName });
        return;
      }
      if (savedStyle) {
        // Colors/fonts: only fill in when the brief has nothing of its own
        // -- unchanged from before. A brief with SOME colors already (even
        // non-conflicting, partial ones) keeps exactly what it has rather
        // than getting silently topped up from the saved style.
        if (savedStyle.colors && (!brief.colors || Object.keys(brief.colors).length === 0)) {
          brief.colors = savedStyle.colors;
          if (savedStyle.fonts && (savedStyle.fonts.heading || savedStyle.fonts.body)) {
            brief.fonts = [savedStyle.fonts.heading || savedStyle.fonts.body, savedStyle.fonts.body || savedStyle.fonts.heading];
          }
        }
        // Buttons: deliberately NOT gated on brief.colors being empty --
        // confirmed real bug, July 2026. Nothing ever sets brief.buttons
        // except a saved Style Guide/Component Library style (Manifest
        // imports and the intake form never touch it), so requiring colors
        // to ALSO be empty meant buttons silently never applied whenever
        // the brief had any colors of its own that didn't conflict -- a
        // very common case, not an edge case. Pulls whenever the saved
        // style has real buttons and the brief doesn't already have its
        // own, independent of the colors/fonts gate above.
        if (Array.isArray(savedStyle.buttons) && savedStyle.buttons.length > 0 && (!brief.buttons || brief.buttons.length === 0)) {
          brief.buttons = savedStyle.buttons;
        }
      }
    }

    setGenerating(true);
    setGeneratingStatus("Building pages...");

    try {
      const inspoContext = buildInspoContext(crawlResults, storedPatterns);
      const briefBase = { ...brief };
      let drafts = null;

      // Draft copy (skip if brief-only or no API)
      if (!copyBriefOnly) {
        setGeneratingStatus("Preparing content...");
        try {
          const controller = new AbortController();
          // 4s was too tight for a call that can draft up to 12 fields —
          // it silently aborted before Claude finished, making the review
          // panel never appear with no indication why. Match the timeout
          // used by the other AI calls in this app (describeMySite, etc).
          setTimeout(() => controller.abort(), 25000);
          const res = await fetch("/api/draft-copy", {
            signal: controller.signal,
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ brief, positioning: { valueProposition: brief.valueProposition || "", targetAudience: brief.targetAudience || "" } }),
          });
          if (!res.ok) {
            console.warn("draft-copy request failed:", res.status);
          } else {
            const data = await res.json();
            if (data.drafts) {
              // Only offer fields for review that would actually fill a blank —
              // drafting over existing brief copy was never the intent.
              const blanksFilled = {};
              Object.keys(data.drafts).forEach(key => {
                if (!briefBase[key] || String(briefBase[key]).trim() === "") blanksFilled[key] = data.drafts[key];
              });
              if (Object.keys(blanksFilled).length > 0) drafts = blanksFilled;
            }
          }
        } catch (draftErr) {
          console.warn("draft-copy request errored, continuing without drafts:", draftErr.message);
        }
      }

      if (drafts) {
        // Pause here — show the review panel instead of building pages.
        // finishGenerate() runs once the user approves or discards.
        pendingGenRef.current = { briefBase, inspoContext };
        setDraftedFields(drafts);
        setGenerating(false);
        setGeneratingStatus("");
        return;
      }

      await finishGenerate(briefBase, inspoContext);

    } catch(genErr) {
      console.error("Generate error:", genErr);
      try {
        const pages = generatePages(brief, selectedPages, "", {}, customPages);
        setGenerated({ pages, inspoContext: "", aiRecs: {} });
        setPreviewPage(selectedPages[0] || "home");
        setDraftsView(false);
      } catch(e2) { console.error("Fallback generate error:", e2); }
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
    a.download = slugify(clientName || brief?.brandName) + "-header-elementor.json";
    a.click(); URL.revokeObjectURL(a.href);
  }

  function downloadFooter() {
    if (!brief) return;
    const colors = brief.colors || {};
    const inspoContext = buildInspoContext(crawlResults, storedPatterns);
    const data = buildFooterJSON(colors, brief, inspoContext);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = slugify(clientName || brief?.brandName) + "-footer-elementor.json";
    a.click(); URL.revokeObjectURL(a.href);
  }

  function downloadPreview(pageId, variant) {
    if (!brief) return;
    var pageForFallback = generated?.pages?.find(pg => pg.id === pageId);
    var html = buildPreviewHTML(brief, pageId, variant || layoutVariants[pageId] || pageForFallback?.recommended || "A", generated?.inspoContext || "");
    var blob = new Blob([html], { type: "text/html" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = slugify(clientName || brief?.brandName) + "-" + pageId + "-preview.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function slugify(name) {
    return (name || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function getPageData(p) {
    var variant = layoutVariants[p.id] || p.recommended || "A";
    var baseData = variant === "F" && p.variantF ? p.variantF : variant === "E" && p.variantE ? p.variantE : variant === "D" && p.variantD ? p.variantD : variant === "C" && p.variantC ? p.variantC : variant === "B" && p.variantB ? p.variantB : p.variantA || p.data;
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
    const customName = (pageDownloadNames[p.id] || "").trim();
    const pageData = getPageData(p);
    const exportData = customName ? { ...pageData, title: he(customName) } : pageData;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = slugify(customName || clientName || brief?.brandName) + "-" + p.id + "-elementor.json";
    a.click(); URL.revokeObjectURL(a.href);
    // Auto-save this single page to the library
    if (brief && generated) {
      saveToLibrary(brief, [p], layoutVariants, layoutVariants);
    }
  }

  function downloadAll() {
    if (!generated) return;
    generated.pages.forEach((p, i) => setTimeout(() => {
      const customName = (pageDownloadNames[p.id] || "").trim();
      const pageData = getPageData(p);
      const exportData = customName ? { ...pageData, title: he(customName) } : pageData;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = slugify(customName || clientName || brief?.brandName) + "-" + p.id + "-elementor.json";
      a.click(); URL.revokeObjectURL(a.href);
    }, i * 300));
    // Auto-save full build to library
    if (brief && generated) {
      saveToLibrary(brief, generated.pages, layoutVariants, layoutVariants);
    }
  }

  // Shared across the live preview and the layout picker below so both
  // agree on which page is active. Previously the live preview and the
  // JSON export (getPageData) fell straight to hardcoded "A" whenever the
  // person hadn't manually clicked a layout card, ignoring recommended
  // entirely -- so a page recommending B would show "B" as Active with a
  // highlighted border in the picker, while the actual rendered preview
  // and downloaded JSON silently stayed on A. Falling back to recommended
  // before "A" makes what's shown/exported match what the picker claims.
  const activePreviewPage = generated?.pages?.find(p => p.id === previewPage);

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

      {/* User management drawer */}
      {isManager && (
        <>
          <div
            onClick={() => setShowUserDrawer(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1050, opacity: showUserDrawer ? 1 : 0, pointerEvents: showUserDrawer ? "auto" : "none", transition: "opacity 0.2s" }}
          />
          <div style={{ position: "fixed", top: 0, right: 0, width: "min(600px, 100vw)", height: "100vh", background: "#fff", borderLeft: "1px solid #dde0e6", zIndex: 1051, display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(0,0,0,0.1)", transform: showUserDrawer ? "translateX(0)" : "translateX(100%)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>{isAdmin ? "Admin Panel" : "Team Management"}</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{isAdmin ? "Add users, update roles and tool access, or remove accounts." : "Add staff members and manage their tool access."}</div>
              </div>
              <button onClick={() => setShowUserDrawer(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <AdminPanel isAdmin={isAdmin} />
            </div>
          </div>
        </>
      )}

      {showBulkLocation && (
        <BulkLocationModal
          brief={brief}
          onClose={() => setShowBulkLocation(false)}
          onGenerate={handleBulkLocationGenerate}
          userId={userId}
        />
      )}

      <ConfirmDialog
        open={!!confirmDraftDeleteId}
        title="Delete this saved draft?"
        message={`This removes "${drafts.find(d => d.id === confirmDraftDeleteId)?.clientName || "this build"}" from your saved drafts. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteDraft(confirmDraftDeleteId); setConfirmDraftDeleteId(null); }}
        onCancel={() => setConfirmDraftDeleteId(null)}
      />

      <ConfirmDialog
        open={!!confirmPageRemoveId}
        title="Remove this page?"
        message={`This removes "${customPages.find(cp => cp.id === confirmPageRemoveId)?.label || "this page"}" and its configuration from this build. This can't be undone.`}
        confirmLabel="Remove"
        onConfirm={() => {
          setCustomPages(prev => prev.filter(cp => cp.id !== confirmPageRemoveId));
          setPages(prev => prev.filter(pid => pid !== confirmPageRemoveId));
          setConfirmPageRemoveId(null);
        }}
        onCancel={() => setConfirmPageRemoveId(null)}
      />

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>Blueprint builds</div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Turn a Customized Brand Brief into a ready-to-import template for your brand.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isManager && (
                <button onClick={() => setShowUserDrawer(true)} style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 500, background: "#ffffff", color: "#3f3f46", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {isAdmin ? "Manage users" : "Manage team"}
                </button>
              )}
              <button onClick={downloadIntakeForm} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 500, background: "#ffffff", color: "#3f3f46", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                ↓ Intake Form
              </button>
              <button
                onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({}); setCustomPages([]); setPageDownloadNames({}); setDraftsView(false); setPlaceholderButtons(null); }}
                style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                + New build
              </button>
            </div>
          </div>

          {draftMsg && (
            <div style={{ marginBottom: "16px", padding: "12px 16px", background: draftMsg.includes("failed") ? "#fef2f2" : "#f5f5f7", border: draftMsg.includes("failed") ? "1px solid #fecaca" : "1px solid #dde0e6", borderRadius: "8px", fontSize: "13px", color: draftMsg.includes("failed") ? "#991b1b" : "#09090b" }}>
              {draftMsg}
            </div>
          )}
          {drafts.length === 0 ? (
            <div style={{ border: "2px dashed #dde0e6", borderRadius: "12px", padding: "64px", textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#09090b", marginBottom: "8px" }}>No saved builds yet</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>Upload a brief or fill out the intake form to get started.</div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({}); setCustomPages([]); setPageDownloadNames({}); setDraftsView(false); setPlaceholderButtons(null); }} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Start a build</button>
                <button onClick={() => { setShowIntake(true); setDraftsView(false); }} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Fill out intake form</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {/* New build card */}
              <div
                onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({}); setCustomPages([]); setPageDownloadNames({}); setDraftsView(false); setPlaceholderButtons(null); }}
                style={{ border: "2px dashed #dde0e6", borderRadius: "10px", padding: "24px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onMouseOver={e => e.currentTarget.style.borderColor = "#b45309"}
                onMouseOut={e => e.currentTarget.style.borderColor = "#dde0e6"}>
                <div style={{ fontSize: "24px", color: "#6b7280" }}>+</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>New build</div>
              </div>

              {drafts.map(draft => {
                const colors = draft.colors || {};
                const colorValues = Object.values(colors).filter(Boolean);
                return (
                  <div key={draft.id} style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "22px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>{draft.clientName}</div>
                    {/* Color preview -- discrete swatches, same pattern as
                        Component Library's cards (name, then swatches, then
                        metadata) rather than this card's old blended
                        gradient, which could smear unrelated colors
                        together at a 6px height. Consistent with the rest
                        of the app instead of its own one-off. */}
                    {colorValues.length > 0 && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        {colorValues.slice(0, 4).map((hex, i) => (
                          <div key={i} style={{ width: "24px", height: "24px", borderRadius: "5px", background: hex, flexShrink: 0 }} />
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6b7280" }}>
                      <span>{draft.date} · {draft.pages.length} page{draft.pages.length !== 1 ? "s" : ""}</span>
                      {draft.hasGenerated && <span style={{ fontSize: "10px", fontWeight: 600, background: "#b45309", color: "#fff", padding: "3px 8px", borderRadius: "20px" }}>Generated</span>}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                      {draft.pages.slice(0, 4).map(p => (
                        <span key={p} style={{ fontSize: "9px", padding: "3px 8px", background: "rgba(180, 83, 9, 0.1)", color: "#b45309", borderRadius: "20px", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "0.02em" }}>{(ALL_PAGES.find(pg => pg.id === p) || {}).label || p.replace(/-\d+$/, "").replace(/(^|-)(.)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase())}</span>
                      ))}
                      {draft.pages.length > 4 && <span style={{ fontSize: "11px", color: "#9ca3af" }}>+{draft.pages.length - 4}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "4px" }}>
                      <button
                        onClick={() => resumeDraft(draft)}
                        style={{ flex: 1, padding: "9px 0", fontSize: "12px", fontWeight: 600, background: "#3f3f46", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                        Resume
                      </button>
                      <button
                        onClick={() => setConfirmDraftDeleteId(draft.id)}
                        style={{ flex: 1, padding: "9px 0", fontSize: "12px", fontWeight: 600, background: "#fff", color: "#6b7280", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!draftsView && (
      <>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: generated ? (panelCollapsed ? "0px 1fr" : "520px 1fr") : "1fr", gap: "0", height: "calc(100vh - 57px)", overflow: "hidden", transition: "grid-template-columns 0.2s ease" }}>

        {/* Single panel-collapse tab, attached to the panel's own right
            edge -- rides the same 0.2s transition as the grid's own
            column width, so it slides from the panel's edge (520px) down
            to the screen's left edge (0px) as the panel collapses,
            becoming the reopen control in the same motion, rather than
            being two separate controls in two different places (the old
            toolbar button only reachable when scrolled to the top, plus a
            second fixed-position tab that only existed for reopening). */}
        {generated && (
          <button
            onClick={() => setPanelCollapsed(c => !c)}
            aria-label={panelCollapsed ? "Show panel" : "Hide panel"}
            title={panelCollapsed ? "Show panel" : "Hide panel"}
            style={{
              position: "absolute", top: "50%", left: panelCollapsed ? "0px" : "520px", transform: "translateY(-50%)",
              zIndex: 200, background: "#b45309", color: "#fff", border: "none",
              borderRadius: "0 6px 6px 0", padding: "12px 6px", cursor: "pointer",
              fontSize: "13px", fontWeight: 600, boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
              display: "flex", alignItems: "center", transition: "left 0.2s ease"
            }}>
            {panelCollapsed ? "▶" : "◀"}
          </button>
        )}

        <div style={{ padding: "clamp(20px,3vw,40px) clamp(16px,3vw,40px)", borderRight: generated ? "1px solid #dde0e6" : "none", overflowY: panelCollapsed ? "hidden" : "auto", overflowX: "hidden", flexShrink: 0, background: "#eeedf1", height: "100%", boxSizing: "border-box" }}>
          <div style={{ maxWidth: generated ? "100%" : "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button onClick={() => setDraftsView(true)} style={{ padding: "5px 10px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: 500, display: "inline-flex", alignItems: "center", lineHeight: 1, gap: "4px", fontSize: "12px", cursor: "pointer" }}>← Builds</button>
            <button onClick={() => setShowBulkLocation(true)} style={{ padding: "5px 10px", background: "#ffffff", color: "#3f3f46", border: "1px solid #dde0e6", borderRadius: "5px", fontWeight: 500, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", lineHeight: 1 }}>Bulk Locations</button>

            {(brief || generated) && (
              <button
                disabled={clearingDraft}
                onClick={async () => {
                  setClearingDraft(true);
                  // Await the actual delete before touching local state — if
                  // this fires-and-forgets, the request can get cut off by a
                  // tab close/navigation before the row is really deleted,
                  // and the next visit reloads the "cleared" draft right
                  // back in. clearSessionDraft() also sets keepalive:true as
                  // a second layer of protection against exactly that.
                  await clearSessionDraft();
                  setBrief(null); setBriefName(""); setClientName(""); setInspoUrls([""]); setPages(["home"]); setPlaceholderButtons(null);
                  setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({});
                  setPreviewPage("home"); setPageOverrides({}); setCustomPages([]); setPageDownloadNames({});
                  setClearingDraft(false);
                }}
                style={{ fontSize: "12px", color: "#6b7280", background: "none", border: "1px solid #dde0e6", borderRadius: "5px", padding: "5px 10px", cursor: clearingDraft ? "default" : "pointer", opacity: clearingDraft ? 0.6 : 1, display: "inline-flex", alignItems: "center", lineHeight: 1 }}>
                {clearingDraft ? "Clearing…" : "Clear draft"}
              </button>
            )}
          </div>


          {/* Layout variant picker — shown when generated page has variants */}
          {generated && (() => {
            if (!activePreviewPage || !activePreviewPage.hasVariants) return null;
            // Was inferred from hasVariantC alone, which stopped being a
            // reliable signal once Home also got a third layout (see
            // generatePages.js) -- checking the actual page id/label
            // pattern instead, matching how generatePages.js itself
            // decides which builder to route to.
            const isLanding = /^(landing|other)(-\d+)?$/.test(activePreviewPage.id);
            const isHome = activePreviewPage.id === "home";
            const variants = isLanding ? (activePreviewPage.hasVariantF ? ["A","B","C","D","E","F"] : activePreviewPage.hasVariantE ? ["A","B","C","D","E"] : activePreviewPage.hasVariantD ? ["A","B","C","D"] : ["A","B","C"]) : (isHome && activePreviewPage.hasVariantC ? ["A","B","C"] : ["A","B"]);
            const labels = isLanding
              ? { A: "Awareness", B: "Lead Form", C: "Retargeting", D: "Varied", E: "Narrative", F: "Location" }
              : isHome
              ? { A: "Centered", B: "Split Image", C: "Minimal" }
              : { A: "Layout A", B: "Layout B" };
            const descs = isLanding
              ? {
                  A: "Feature rows + services checklist with dual phone and contact CTAs. Best for cold traffic and brand awareness.",
                  B: "Inline quote request form with testimonials and feature rows. Best for high-intent traffic ready to convert.",
                  C: "Tight hero, three outcome bullets, single testimonial, one CTA. Best for retargeting warm audiences.",
                  D: "Each section gets a different visual treatment — split image, a centered call-out, a plain block — cycling through automatically. Best for pages with several distinct sections that shouldn't all look the same.",
                  E: "Same hero as Awareness, but social proof moves up right after the trust strip instead of sitting at the bottom, and a secondary CTA appears every few sections instead of just once at the end. Best for cold traffic on longer pages that need trust built in early.",
                  F: "Headline, address, hours, and a real map combined into one section instead of a separate hero — the location info IS the hero. Best for pages with a real business address where local trust matters more than a big opening pitch.",
                }
              : isHome
              ? {
                  A: "Centered, bold hero with dual CTAs. The default, well-rounded option.",
                  B: "Hero split with an image alongside the headline. Good when there's real photography to lead with.",
                  C: "Large minimal hero, no image, single CTA — and a numbered list instead of bordered cards for the services section. Best for a quieter, editorial feel.",
                }
              : { A: "Primary layout for this page type.", B: "Alternate layout with a different section structure." };
            const current = layoutVariants[previewPage] || activePreviewPage.recommended || "A";
            return (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Layout — {(activePreviewPage.label || previewPage).replace(/-\d+$/, "")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {variants.map(v => {
                    const active = current === v;
                    const isRec  = !!activePreviewPage.recommendedReasoned && v === (activePreviewPage.recommended || "A");
                    return (
                      <div
                        key={v}
                        onClick={() => setLayoutVariants(prev => ({ ...prev, [previewPage]: v }))}
                        style={{
                          padding: "16px 18px", borderRadius: "6px", cursor: "pointer",
                          border: active ? "2px solid #b45309" : "1px solid #dde0e6",
                          background: active ? "rgba(180,83,9,0.04)" : "#ffffff",
                          display: "flex", flexDirection: "column", gap: "4px",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: active ? "#b45309" : "#09090b" }}>{labels[v]}</span>
                          {isRec && <span style={{ fontSize: "9px", fontWeight: 700, background: "#b45309", color: "#fff", borderRadius: "3px", padding: "1px 5px", letterSpacing: "0.04em" }}>RECOMMENDED</span>}
                          {active && <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 600, color: "#b45309" }}>✓ Active</span>}
                        </div>
                        <span style={{ fontSize: "12px", color: active ? "#a3673a" : "#6b7280", lineHeight: 1.5 }}>{descs[v]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Hero eyebrow — landing.js reads brief.heroEyebrow directly,
              falling back to the brand name when it's unset. Manifest's own
              hero section has no eyebrow concept at all, so every
              Manifest-imported page was silently showing the brand name as
              its eyebrow with no way to change it short of a JSON re-upload
              with the field hand-added. IntakeForm.jsx already has this
              exact input for its own from-scratch intake flow -- this is
              the same field, just also exposed for an already-loaded
              brief. Same visibility scope as Location Details below:
              landing/other pages, since heroEyebrowText is only read by
              landing.js's variants. */}
          {generated && (() => {
            const eyebrowPage = activePreviewPage;
            if (!eyebrowPage || !/^(landing|other)(-\d+)?$/.test(eyebrowPage.id)) return null;
            return (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>
                  Hero Eyebrow
                </div>
                <div style={T.surface}>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px", lineHeight: 1.5 }}>
                    Small label above the hero headline. Leave blank to show the brand name (today's default).
                  </div>
                  <input
                    type="text"
                    value={brief.heroEyebrow || ""}
                    onChange={e => updateHeroEyebrow(e.target.value)}
                    onBlur={commitBriefFieldEdit}
                    placeholder={brief.brandName || "e.g. Federal DOT Inspections"}
                    style={{ width: "100%", padding: "12px 14px", fontSize: "14px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#ffffff", color: "#09090b", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Location details — manual override for Variant F's map/address
              when Manifest didn't send a map_location section for this page
              (e.g. a service page with no location content at all, like
              MESO's Atlanta DOT-inspection page). Same visibility scope as
              Section Styles below: any landing/other page, since Variant F
              is always available there regardless of whether address data
              exists yet (see generatePages.js's hasVariantF: true). Blank
              fields fall back to the existing placeholder/no-city behavior
              already built into landing.js and landingPreview.js -- this
              is purely an alternate way to fill brief.mapAddress/mapCity,
              not a new rendering path. */}
          {generated && (() => {
            const locPage = activePreviewPage;
            if (!locPage || !/^(landing|other)(-\d+)?$/.test(locPage.id)) return null;
            return (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>
                  Location Details
                </div>
                <div style={T.surface}>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px", lineHeight: 1.5 }}>
                    Only needed if Manifest didn't send an address for this page. Powers the map on Variant F (Location).
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>Address</label>
                      <input
                        type="text"
                        value={brief.mapAddress || ""}
                        onChange={e => updateMapAddress(e.target.value)}
                        onBlur={commitBriefFieldEdit}
                        placeholder="123 Main St, Your City, ST 00000"
                        style={{ width: "100%", padding: "12px 14px", fontSize: "14px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#ffffff", color: "#09090b", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>City (for the page title, e.g. "Brand — City — Landing Page (Location)")</label>
                      <input
                        type="text"
                        value={brief.mapCity || ""}
                        onChange={e => updateMapCity(e.target.value)}
                        onBlur={commitBriefFieldEdit}
                        placeholder="Your City"
                        style={{ width: "100%", padding: "12px 14px", fontSize: "14px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#ffffff", color: "#09090b", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section styles picker — landing/other pages only, matches
              where brief.featureLayout actually applies. Replaces the old
              AFS-only hardcoded layout with a real per-brief UI over the
              same mechanism. */}
          {generated && (() => {
            const secPage = activePreviewPage;
            if (!secPage || !/^(landing|other)(-\d+)?$/.test(secPage.id)) return null;
            const featureCount = Array.isArray(brief.features) && brief.features.length > 0 ? brief.features.length : 3;
            const rows = getSectionRows(brief, featureCount);
            const featureLabel = (idx) => {
              if (Array.isArray(brief.features) && brief.features[idx]) return brief.features[idx].heading || "(untitled)";
              const key = "feature" + (idx + 1) + "Heading";
              return brief[key] || "(untitled)";
            };
            return (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Section Styles
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px", lineHeight: 1.5 }}>
                  How each content section renders, regardless of which layout (A–E) is active. Untouched rows use the same automatic pattern as before.
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer", marginBottom: "10px" }}>
                  <input type="checkbox" checked={!!brief.skipServicesChecklist} onChange={e => toggleSkipServicesChecklist(e.target.checked)} style={{ cursor: "pointer" }} />
                  Hide the services checklist section
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer", marginBottom: "10px" }}>
                  <input type="checkbox" checked={!!brief.skipTrustStats} onChange={e => toggleSkipTrustStats(e.target.checked)} style={{ cursor: "pointer" }} />
                  Hide the trust stats (years/projects/satisfaction)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer", marginBottom: "10px" }}>
                  <input type="checkbox" checked={!!brief.skipFaqSection} onChange={e => toggleSkipFaqSection(e.target.checked)} style={{ cursor: "pointer" }} />
                  Hide the FAQ section
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer", marginBottom: "10px" }}>
                  <input type="checkbox" checked={!!brief.skipTestimonials} onChange={e => toggleSkipTestimonials(e.target.checked)} style={{ cursor: "pointer" }} />
                  Hide the testimonials section
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {rows.map((row, rowIdx) => {
                    const isGrouped = row.indices.length > 1;
                    const canGroupNext = rowIdx < rows.length - 1 && rows[rowIdx + 1].indices.length === 1 && rows[rowIdx + 1].postClosing === row.postClosing;
                    return (
                      <div key={rowIdx} style={{ padding: "16px 18px", borderRadius: "6px", border: "1px solid #dde0e6", background: "#ffffff", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>
                          {isGrouped ? row.indices.map(featureLabel).join(" + ") : featureLabel(row.indices[0])}
                        </div>

                        {isGrouped ? (
                          <input
                            value={row.header}
                            onChange={e => setSectionRowHeader(rows, rowIdx, e.target.value)}
                            placeholder="Shared heading for this group…"
                            style={{ padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", width: "100%", boxSizing: "border-box" }}
                          />
                        ) : (
                          <select
                            value={row.style}
                            onChange={e => setSectionRowStyle(rows, rowIdx, e.target.value)}
                            // Same custom SVG chevron pattern already
                            // proven throughout Template Studio -- this
                            // was relying on the browser's own native
                            // select arrow with no room reserved for it,
                            // which is exactly what looked disproportionate
                            // and cramped against the border.
                            style={{ padding: "10px 30px 10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 5 5-5' stroke='%236b635c' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 12px center", width: "100%", cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", boxSizing: "border-box" }}>
                            {Object.entries(SECTION_STYLE_LABELS).map(([val, label]) => (
                              (val === "video" && !brief.videoUrl) ? null :
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          {(isGrouped || canGroupNext) && (
                            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#6b7280", cursor: "pointer" }}>
                              <input type="checkbox" checked={isGrouped} onChange={() => toggleGroupWithNext(rows, rowIdx)} style={{ cursor: "pointer" }} />
                              Group with next row
                            </label>
                          )}
                          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#6b7280", cursor: "pointer" }}>
                            <input type="checkbox" checked={row.postClosing} onChange={e => setSectionRowPostClosing(rows, rowIdx, e.target.checked)} style={{ cursor: "pointer" }} />
                            Move after closing CTA
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* STEP 1 */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>Brand Brief</div>
            <div style={{ ...T.surface, border: brief ? "1px solid #dde0e6" : "1px solid #dde0e6" }}>
              {!brief ? (
                <>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <button
                      onClick={() => setUploadSource("standard")}
                      style={{
                        flex: 1, padding: "10px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", cursor: "pointer",
                        border: uploadSource === "standard" ? "2px solid #b45309" : "1px solid #dde0e6",
                        background: uploadSource === "standard" ? "#fffaf3" : "#ffffff",
                        color: uploadSource === "standard" ? "#09090b" : "#6b7280",
                      }}>
                      Standard Brief
                    </button>
                    <button
                      onClick={() => setUploadSource("manifest")}
                      style={{
                        flex: 1, padding: "10px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", cursor: "pointer",
                        border: uploadSource === "manifest" ? "2px solid #b45309" : "1px solid #dde0e6",
                        background: uploadSource === "manifest" ? "#fffaf3" : "#ffffff",
                        color: uploadSource === "manifest" ? "#09090b" : "#6b7280",
                      }}>
                      Import from Manifest
                    </button>
                  </div>
                  {uploadSource === "manifest" && (
                    <div style={{ marginBottom: "16px", textAlign: "center" }}>
                      <a
                        href="/downloads/Spec_Manifest_Copy_Template.docx"
                        download
                        style={{ fontSize: "12px", color: "#b45309", fontWeight: 600, textDecoration: "none" }}
                      >
                        ↓ Download the copy template for Manifest
                      </a>
                    </div>
                  )}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    style={{ border: "2px dashed #dde0e6", borderRadius: "6px", padding: "32px", textAlign: "center", cursor: "pointer" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#000"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#dde0e6"}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>↑</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "4px" }}>
                      {uploadSource === "manifest" ? "Upload Manifest Export" : "Upload Brand Brief"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {uploadSource === "manifest" ? "JSON only" : "PDF, DOCX, JSON, or TXT"}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={uploadSource === "manifest" ? ".json" : ".json,.pdf,.txt,.docx"}
                      style={{ display: "none" }}
                      onChange={e => handleFile(e.target.files[0])}
                    />
                  </div>
                  <div style={{ textAlign: "center", margin: "12px 0", fontSize: "12px", color: "#9ca3af" }}>or</div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => setShowIntake(true)}
                    style={{ padding: "12px 32px", fontSize: "13px", fontWeight: 600, background: "#b45309", border: "none", borderRadius: "8px", cursor: "pointer", color: "#ffffff" }}>
                    Fill out intake form
                  </button>
                  </div>
                  {parsing && <div style={{ marginTop: "12px", fontSize: "13px", color: "#09090b" }}>Reading brief — this takes a few seconds...</div>}
                  {briefError && <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px", whiteSpace: "pre-wrap" }}>{briefError}</div>}
                  {placeholderButtons && (
                    <div style={{ marginTop: "8px", padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#991b1b", marginBottom: "6px" }}>
                        {placeholderButtons.length} button{placeholderButtons.length !== 1 ? "s need" : " needs"} a real destination before publishing
                      </div>
                      {placeholderButtons.map((b, i) => (
                        <div key={i} style={{ fontSize: "12px", color: "#7f1d1d", marginBottom: i < placeholderButtons.length - 1 ? "3px" : 0 }}>
                          • "{b.label}" ({b.section}) — currently links nowhere
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
                    Review all copy &amp; links on template before publishing.
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>{brief.brandName || "Brand loaded"}</div>
                  {(brief._manifestTitleTag || brief._manifestMetaDescription) && (
                    <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#eeedf1", borderRadius: "6px", fontSize: "11px", color: "#6b7280" }}>
                      <div style={{ fontWeight: 600, color: "#09090b", marginBottom: "4px", fontSize: "11px" }}>For WordPress / Yoast — copy over after import</div>
                      {brief._manifestTitleTag && <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: 600 }}>Title:</span> {brief._manifestTitleTag}</div>}
                      {brief._manifestMetaDescription && <div><span style={{ fontWeight: 600 }}>Meta:</span> {brief._manifestMetaDescription}</div>}
                    </div>
                  )}
                  <div style={{ marginBottom: "32px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>
                      Colors
                    </div>
                    <div style={T.surface}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {COLOR_FIELDS.map(f => (
                          <div key={f.key} style={{ display: "grid", gridTemplateColumns: "90px 34px 1fr", gap: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", color: "#6b7280" }}>{f.label}</span>
                            <input
                              type="color"
                              value={(brief.colors && brief.colors[f.key]) || "#ffffff"}
                              onChange={e => setBriefColor(f.key, e.target.value)}
                              style={{ width: "34px", height: "34px", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", padding: "2px" }}
                            />
                            <input
                              value={(brief.colors && brief.colors[f.key]) || ""}
                              onChange={e => setBriefColor(f.key, e.target.value)}
                              placeholder="#000000"
                              style={{ padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace", color: "#09090b", outline: "none", width: "100%", boxSizing: "border-box" }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "8px", alignItems: "center", marginTop: "12px" }}>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>Heading font</span>
                        <input
                          value={(brief.fonts && brief.fonts[0]) || ""}
                          onChange={e => setBriefFont(0, e.target.value)}
                          placeholder="e.g. Inter"
                          style={{ padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", width: "100%", boxSizing: "border-box" }}
                        />
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>Body font</span>
                        <input
                          value={(brief.fonts && brief.fonts[1]) || ""}
                          onChange={e => setBriefFont(1, e.target.value)}
                          placeholder="e.g. Inter"
                          style={{ padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: "32px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>
                      Buttons
                    </div>
                    <div style={T.surface}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <ButtonEditor
                          locked
                          button={(brief.buttons || []).find(b => isNamedButton(b, "primary")) || defaultBriefButton("primary")}
                          onChange={updated => setBriefButtonByName("primary", updated)}
                        />
                        <ButtonEditor
                          locked
                          button={(brief.buttons || []).find(b => isNamedButton(b, "secondary")) || defaultBriefButton("secondary")}
                          onChange={updated => setBriefButtonByName("secondary", updated)}
                        />
                        {(brief.buttons || []).map((b, i) => (isNamedButton(b, "primary") || isNamedButton(b, "secondary")) ? null : (
                          <ButtonEditor key={i} button={b} onChange={updated => updateBriefButton(i, updated)} onRemove={() => removeBriefButton(i)} />
                        ))}
                        <button
                          onClick={addBriefButton}
                          style={{ padding: "8px", fontSize: "11px", fontWeight: 600, border: "1px dashed #dde0e6", borderRadius: "6px", background: "#fff", color: "#6b7280", cursor: "pointer" }}>
                          + Add button
                        </button>
                      </div>
                    </div>
                  </div>
                  {brief.brandName && (
                    <div style={{ marginBottom: "32px", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {((brief.colors && Object.keys(brief.colors).length > 0)
                          || (Array.isArray(brief.fonts) && brief.fonts.some(f => f))
                          || (Array.isArray(brief.buttons) && brief.buttons.length > 0)) && (
                          <button
                            onClick={saveBrandStyle}
                            style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 600, border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", color: "#09090b", cursor: "pointer" }}>
                            Save as {brief.brandName}'s style guide
                          </button>
                        )}
                        <button
                          onClick={() => showStylePicker ? setShowStylePicker(false) : openStylePicker()}
                          style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 600, border: "1px solid #dde0e6", borderRadius: "6px", background: showStylePicker ? "#f3f4f6" : "#fff", color: "#09090b", cursor: "pointer" }}>
                          Load a saved style guide
                        </button>
                        {stylePanelStatus && <span style={{ fontSize: "11px", color: "#6b7280" }}>{stylePanelStatus}</span>}
                      </div>
                      {showStylePicker && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 20, width: "280px", maxHeight: "320px", overflowY: "auto", background: "#fff", border: "1px solid #dde0e6", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "8px" }}>
                          {loadingStyles && <div style={{ fontSize: "12px", color: "#6b7280", padding: "8px" }}>Loading saved styles...</div>}
                          {!loadingStyles && pickerError && (
                            <div style={{ fontSize: "12px", color: "#dc2626", padding: "8px" }}>{pickerError}</div>
                          )}
                          {!loadingStyles && !pickerError && savedStylesList.length === 0 && (
                            <div style={{ fontSize: "12px", color: "#6b7280", padding: "8px" }}>
                              No saved style guides yet. Save one from the button above and it'll show up here.
                            </div>
                          )}
                          {!loadingStyles && savedStylesList.map(style => (
                            <div
                              key={style.id}
                              onClick={() => applySavedStyle(style)}
                              style={{ padding: "8px", borderRadius: "6px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#09090b" }}>{style.name}</span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                {Object.entries(style.colors || {}).slice(0, 8).map(([id, hex]) => (
                                  <div key={id} title={id + ": " + hex} style={{ width: "16px", height: "16px", borderRadius: "3px", background: hex, border: "1px solid rgba(0,0,0,.1)" }} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                    Files will download as: <span style={{ color: "#09090b", fontWeight: 600 }}>{slugify(clientName || brief?.brandName)}-home-elementor.json</span>
                  </div>
                  <button style={T.btnGhost} onClick={() => { setBrief(null); setBriefName(""); setClientName(""); setPlaceholderButtons(null); setPageDownloadNames({}); }}>Replace brief</button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Inspo URLs</div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#b45309", marginLeft: "auto" }}>Optional</span>
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
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>Pages to Build</div>
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
                      onClick={e => { e.preventDefault(); setConfirmPageRemoveId(p.id); }}
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
                    {ADDITIONAL_PAGE_TYPES.filter(p => !customPages.find(cp => cp.id === p.id || cp.id.startsWith(p.id + "-")) && !selectedPages.includes(p.id) && !selectedPages.some(sid => sid.startsWith(p.id + "-"))).map(p => (
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
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>Copy Settings</div>
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
            disabled={!canGenerate || generating || !!draftedFields}
            style={{ ...T.btnPrimary, justifyContent: "center", padding: "14px 40px", fontSize: "14px", borderRadius: "8px", opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? "pointer" : "not-allowed" }}>
            {generating ? (generatingStatus || "Generating…") : "Generate " + selectedPages.length + " Page" + (selectedPages.length !== 1 ? "s" : "")}
          </button>
          </div>
          {!brief && <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>Upload a brand brief to enable generation</div>}
          {brief && (() => {
            // Page generation itself is free — this only reflects
            // draft-copy.js, which only runs when "Use brief copy only" is
            // off and something is still blank. See utils/estimateCost.js —
            // same function a future breakdown panel would call too.
            const est = estimateGenerationCost(brief, copyBriefOnly);
            const label = !est.willDraft
              ? "Estimated cost: $0.00 — using brief copy only"
              : `Estimated cost: ~$${est.costDollars.toFixed(2)} — AI will draft ${est.blankFieldCount} blank field${est.blankFieldCount !== 1 ? "s" : ""}`;
            return <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>{label}</div>;
          })()}

          {/* AI Drafted fields approval — gates page generation until reviewed */}
          {draftedFields && Object.keys(draftedFields).length > 0 && (
            <div style={{ marginTop: "24px", ...T.surface }}>
              <div style={{ padding: "16px", background: "#ffffff", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>
                  {Object.keys(draftedFields).length} field{Object.keys(draftedFields).length !== 1 ? "s" : ""} drafted in brand voice
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "12px" }}>Review and edit before anything is built. These will fill blank fields in the brief.</div>
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
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={approveDraftedFields}
                    style={{ ...T.btnPrimary, fontSize: "12px" }}>
                    Approve &amp; continue
                  </button>
                  <button
                    onClick={discardDraftedFields}
                    style={{ ...T.btnGhost, fontSize: "12px" }}>
                    Discard &amp; continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {generated && (
            <div style={{ marginTop: "24px", ...T.surface }}>
              {/* Swap sections — moved from preview header into panel */}
              {sectionLibrary.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Sections</div>
                  <button
                    onClick={() => { setSwapDrawer(swapDrawer === previewPage ? null : previewPage); setSwapFilter(""); }}
                    style={{ ...T.btnGhost, width: "100%", justifyContent: "space-between", padding: "12px 16px", fontSize: "13px" }}>
                    <span>Swap sections</span>
                    <span style={{ color: "#b45309" }}>↗</span>
                  </button>
                </div>
              )}
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Download</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {generated.pages.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input
                      type="text"
                      value={pageDownloadNames[p.id] || ""}
                      onChange={(e) => setPageDownloadNames(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={`Name this template (optional) — defaults to "${p.label}"`}
                      style={{ fontSize: "13px", padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", color: "#09090b", fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                    <button onClick={() => downloadPage(p)} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "12px 16px", fontSize: "13px" }}>
                      <span>{p.label}</span><span style={{ color: "#b45309" }}>↓ .json</span>
                    </button>
                  </div>
                ))}
                {generated.pages.length > 1 && (
                  <button onClick={downloadAll} style={{ ...T.btnPrimary, justifyContent: "center", marginTop: "-6px", padding: "12px 16px", fontSize: "13px" }}>Download All Pages</button>
                )}
                <div style={{ height: "1px", background: "#dde0e6", margin: "10px 0" }} />
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Global Templates</div>
                <button onClick={downloadHeader} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "12px 16px", fontSize: "13px" }}>
                  <span>Header</span><span style={{ color: "#b45309" }}>↓ .json</span>
                </button>
                <button onClick={downloadFooter} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "12px 16px", fontSize: "13px" }}>
                  <span>Footer</span><span style={{ color: "#b45309" }}>↓ .json</span>
                </button>
              </div>
              <div style={{ height: "1px", background: "#dde0e6", margin: "18px 0" }} />
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Preview</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {generated.pages.map(p => (
                  <button key={p.id + "-preview"} onClick={() => downloadPreview(p.id, layoutVariants[p.id] || p.recommended || "A")} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "12px 16px", fontSize: "13px" }}>
                    <span>{(p.label || p.id).replace(/-\d{5,}$/, "")}</span><span style={{ color: "#b45309" }}>↓ .html</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px", lineHeight: 1.5 }}>Open in browser to scroll and screenshot the full page.</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "14px" }}>
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
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: previewPage === p.id ? "1px solid #3f3f46" : "1px solid #dde0e6", borderRadius: "20px", background: previewPage === p.id ? "#3f3f46" : "#fff", color: previewPage === p.id ? "#fff" : "#09090b" }}>
                  {cleanLabel}
                </button>);
              })}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowAddPagePreview(!showAddPagePreview)} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px dashed #dde0e6", borderRadius: "20px", background: "#fff", color: "#6b7280" }}>+ Add Page</button>
                {showAddPagePreview && (
                  <div style={{ position: "absolute", top: "100%", left: 0, width: "280px", marginTop: "4px", background: "#fff", border: "1px solid #dde0e6", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: "320px", overflowY: "auto" }}>
                    {ADDITIONAL_PAGE_TYPES.filter(p => !selectedPages.includes(p.id) && !selectedPages.some(sid => sid.startsWith(p.id + "-")) && !customPages.find(cp => cp.id === p.id || cp.id.startsWith(p.id + "-"))).map(p => (
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

              {/* Desktop / Mobile toggle — pushed to far right */}
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
                      var brass = colors.brass || "#52525B";
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
                srcDoc={buildPreviewHTML(brief, previewPage, layoutVariants[previewPage] || activePreviewPage?.recommended || "A", generated?.inspoContext || "")}
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
      </>
      )} {/* end !draftsView grid */}

      {/* Brand style guide conflict -- pauses generate() until resolved */}
      {styleConflict && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000 }} onClick={() => setStyleConflict(null)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px, 92vw)", background: "#fff", borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.25)", zIndex: 2001, padding: "28px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b", marginBottom: "8px" }}>Two color sets for {styleConflict.brandName}</div>
            <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5, marginBottom: "20px" }}>
              This import came with its own colors, and there's also a saved style guide for {styleConflict.brandName}. Which should this page use?
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>This import</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {Object.entries(styleConflict.briefColors || {}).slice(0, 8).map(([id, hex]) => (
                    <div key={id} title={id + ": " + hex} style={{ width: "20px", height: "20px", borderRadius: "3px", background: hex, border: "1px solid rgba(0,0,0,.1)" }} />
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Saved style guide</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {Object.entries(styleConflict.savedStyle.colors || {}).slice(0, 8).map(([id, hex]) => (
                    <div key={id} title={id + ": " + hex} style={{ width: "20px", height: "20px", borderRadius: "3px", background: hex, border: "1px solid rgba(0,0,0,.1)" }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => resolveStyleConflict(false)} style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", color: "#09090b", cursor: "pointer" }}>Use this import's colors</button>
              <button onClick={() => resolveStyleConflict(true)} style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "6px", background: "#b45309", color: "#fff", cursor: "pointer" }}>Use saved style guide</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}





























