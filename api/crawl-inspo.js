export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth — verify userId exists in Redis as a known Spec user
  const _userId = req.headers["x-spec-user-id"] || (req.body && req.body._userId) || req.query._userId;
  if (!_userId) return res.status(401).json({ error: "Unauthorized" });
  const _kvUrl = process.env.KV_REST_API_URL;
  const _kvToken = process.env.KV_REST_API_TOKEN;
  if (_kvUrl && _kvToken) {
    try {
      const _profileRes = await fetch(`${_kvUrl}/get/${encodeURIComponent("spec:user:" + _userId)}`, {
        headers: { Authorization: "Bearer " + _kvToken }
      });
      const _profileData = await _profileRes.json();
      if (!_profileData.result) return res.status(401).json({ error: "Unauthorized" });
    } catch { return res.status(401).json({ error: "Unauthorized" }); }
  }


  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    // Normalize URL
    const base = new URL(url.startsWith("http") ? url : "https://" + url);
    const origin = base.origin;

    // Fetch the home/root page to find nav links
    const rootHtml = await fetchPage(base.href);
    if (!rootHtml) return res.status(400).json({ error: "Could not fetch " + base.href });

    // Extract nav links from the page
    const navLinks = extractNavLinks(rootHtml, origin);

    // Deduplicate and filter to same-origin internal pages only
    const allUrls = [base.href, ...navLinks].filter((u, i, arr) => arr.indexOf(u) === i).slice(0, 8);

    // Fetch each page and extract structure
    const pages = await Promise.all(
      allUrls.map(async (pageUrl) => {
        const html = await fetchPage(pageUrl);
        if (!html) return null;
        const path = new URL(pageUrl).pathname;
        const pageType = inferPageType(path);
        const structure = extractStructure(html);
        return { url: pageUrl, path, pageType, structure };
      })
    );

    const discovered = pages.filter(Boolean);

    // Use Claude to summarize the structural patterns per page type
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return raw structure if no API key
      return res.status(200).json({ origin, pages: discovered });
    }

    const summary = await summarizeWithClaude(apiKey, origin, discovered);

    return res.status(200).json({
      origin,
      pageCount: discovered.length,
      pages: discovered.map(p => ({ url: p.url, path: p.path, pageType: p.pageType })),
      patterns: summary,
    });

  } catch (err) {
    console.error("crawl-inspo error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SpecCrawler/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractNavLinks(html, origin) {
  const links = [];
  // Match href attributes in nav, header areas
  const navMatch = html.match(/<(nav|header)[^>]*>([\s\S]*?)<\/(nav|header)>/gi) || [];
  const searchArea = navMatch.length > 0 ? navMatch.join(" ") : html;

  const hrefRegex = /href=["']([^"'#?]+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(searchArea)) !== null) {
    const href = match[1];
    try {
      const resolved = new URL(href, origin).href;
      if (resolved.startsWith(origin) && resolved !== origin && resolved !== origin + "/") {
        const path = new URL(resolved).pathname;
        // Skip obvious non-page paths
        if (!path.match(/\.(jpg|png|gif|svg|css|js|pdf|ico|woff|ttf)$/i) &&
            !path.includes("/wp-") && !path.includes("/feed") &&
            !path.includes("/cdn-") && !path.includes("/assets")) {
          links.push(resolved.replace(/\/$/, "") || resolved);
        }
      }
    } catch {}
  }
  return [...new Set(links)];
}

function inferPageType(path) {
  const p = path.toLowerCase().replace(/\//g, "");
  if (!p || p === "home" || p === "index") return "home";
  if (p.match(/work|portfolio|project|film|case|show/)) return "work";
  if (p.match(/service|pricing|package|offer|cost|rate/)) return "services";
  if (p.match(/about|story|team|maker|founder|us/)) return "about";
  if (p.match(/process|how|approach|method/)) return "process";
  if (p.match(/contact|reach|connect|hire|start/)) return "contact";
  return "other";
}

function extractStructure(html) {
  // Strip scripts and styles
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
  return clean;
}

async function summarizeWithClaude(apiKey, origin, pages) {
  const pageDescriptions = pages.map(p =>
    "PAGE: " + p.pageType + " (" + p.path + ")\n" + p.structure.slice(0, 600)
  ).join("\n\n---\n\n");

  const prompt = `You are analyzing a reference website (${origin}) to extract structural and design patterns that can inform a new website build.

Here is the text content extracted from each page:

${pageDescriptions}

Return ONLY a valid JSON object with this structure:
{
  "siteNotes": "2-3 sentence summary of the overall site style and tone",
  "pages": {
    "home": "what the home page hero and sections look like structurally",
    "work": "how the portfolio/work page is structured",
    "services": "how services or pricing is presented",
    "about": "how the about page tells the story",
    "process": "how the process page is laid out",
    "contact": "how the contact page is structured"
  }
}

Only include page keys that were found on the site. Keep each value to 1-2 sentences focused on layout and structure, not copying any copy verbatim.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: "You are a structural design analyst. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}
