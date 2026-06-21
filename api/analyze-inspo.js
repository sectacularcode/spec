export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Clerk auth — verify session token from Authorization header or __session cookie
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) return res.status(500).json({ error: "Auth not configured" });
  const authHeader = req.headers.authorization || "";
  const cookieHeader = req.headers.cookie || "";
  const sessionToken =
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    (cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/)?.[1]) ||
    null;
  if (!sessionToken) return res.status(401).json({ error: "Unauthorized" });
  try {
    const verifyRes = await fetch("https://api.clerk.com/v1/tokens/verify", {
      method: "POST",
      headers: { "Authorization": "Bearer " + clerkSecretKey, "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessionToken })
    });
    if (!verifyRes.ok) return res.status(401).json({ error: "Unauthorized" });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }


  const { patterns, pages, brandVoice } = req.body || {};
  if (!patterns || !pages || !pages.length) {
    return res.status(400).json({ error: "Missing patterns or pages" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  // If no patterns, skip AI and return all A defaults
  const patternText = typeof patterns === "string" ? patterns : JSON.stringify(patterns);
  if (!patternText || patternText.length < 20) {
    const defaults = {};
    pages.forEach(p => { defaults[p] = { variant: "A", reason: "No inspo patterns available" }; });
    return res.status(200).json({ recommendations: defaults });
  }

  const prompt = `You are a web design strategist analyzing reference site patterns to recommend the best layout variant for each page of a new website build.

BRAND CONTEXT:
${brandVoice || "Professional services brand. Clean, confident, no filler."}

STRUCTURAL PATTERNS OBSERVED ACROSS ALL REFERENCE SITES:
${patternText}

AVAILABLE LAYOUT VARIANTS:
- work: A = filter row + standard grid | B = featured hero tile + supporting grid beneath
- about: A = story text + portrait split | B = vertical milestone timeline
- process: A = two-column numbered grid | B = horizontal cards with top accent border
- contact: A = stacked header + form + info split | B = big statement left + lean form right

PAGES TO BUILD: ${pages.join(", ")}

For each page, analyze ALL the patterns (not just patterns from that specific page type) and decide which variant best fits the overall site feel and the structural patterns observed. A timeline on an About page of a reference site should inform Process too. A split layout on Contact should inform About. Think across pages.

Return ONLY valid JSON:
{
  "recommendations": {
    "work": { "variant": "A" or "B", "reason": "one sentence" },
    "about": { "variant": "A" or "B", "reason": "one sentence" },
    "process": { "variant": "A" or "B", "reason": "one sentence" },
    "contact": { "variant": "A" or "B", "reason": "one sentence" }
  }
}

Only include keys for pages in the PAGES TO BUILD list. Never include home or services — those have no variants.`;

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
        max_tokens: 600,
        system: "You are a structural web design analyst. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      // Fall back to all A on API error
      const defaults = {};
      pages.forEach(p => { defaults[p] = { variant: "A", reason: "API unavailable" }; });
      return res.status(200).json({ recommendations: defaults });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const defaults = {};
      pages.forEach(p => { defaults[p] = { variant: "A", reason: "Could not parse response" }; });
      return res.status(200).json({ recommendations: defaults });
    }

    return res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (err) {
    const defaults = {};
    pages.forEach(p => { defaults[p] = { variant: "A", reason: "Error: " + err.message }; });
    return res.status(200).json({ recommendations: defaults });
  }
}
