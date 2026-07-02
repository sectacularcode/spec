import { mkContainer, mkHeading, mkText, mkButton, mkSpacer, mkDivider } from "./helpers.js";

export function buildServicesPage(C, brief, _inspoHint) {
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

export function buildServicesPageLight(C, brief, _inspoHint) {
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

