// Image library and placeholder utilities
// pickImage() selects a placeholder image URL by category + seed.
// imgOrPlaceholder() uses a real URL if provided, otherwise picks from the library.

const IMAGE_LIBRARY = {
  // Marketing agency: creative teams, ad work, brainstorm, modern offices
  marketing: [
    "1551434678-e076c223a692", "1556761175-5973dc0f32e7", "1552664730-d307ca884978",
    "1486312338219-ce68d2c6f44d", "1542744173-8e7e53415bb0", "1517048676732-d65bc937f952",
    "1559136555-9303baea8ebd", "1521737604893-d14cc237f11d", "1542626991-cbc4e32524cc",
    "1556761175-b413da4baf72", "1497215842964-222b430dc094", "1531545514256-b1400bc00f31",
  ],
  // Production studio: cameras, lenses, lighting, studio spaces, photographers
  production: [
    "1502920917128-1aa500764cbd", "1485846234645-a62644f84728", "1492691527719-9d1e07e534b4",
    "1486818711795-cdc8e3a6f23a", "1518770660439-4636190af475", "1454165804606-c3d57bc86b40",
    "1532800783378-1bed60adaf58", "1518495973542-4542c06a5843", "1500634245200-e5245c7574ef",
    "1542038784456-1ea8e935640e", "1500634245200-e5245c7574ef", "1452457750107-cd084dce177d",
  ],
  // E-commerce: products, fashion, packaging, lifestyle product shots
  product: [
    "1542291026-7eec264c27ff", "1523275335684-37898b6baf30", "1505740420928-5e560c06d30e",
    "1556228720-195a672e8a03", "1583394838336-acd977736f90", "1591047139829-d91aecb6caea",
    "1571781926291-c477ebfd024b", "1556905055-8f358a7a47b2", "1596462502278-27bfdc403348",
    "1485518882345-15568b007407", "1490481651871-ab68de25d43d", "1576566588028-4147f3842f27",
  ],
  // Lifestyle blog: wellness, food, home, travel, cozy moments
  lifestyle: [
    "1545205597-3d9d02c29597", "1506905925346-21bda4d32df4", "1499209974431-9dddcece7f88",
    "1490645935967-10de6ba17061", "1493770348161-369560ae357d", "1551218808-94e220e084d2",
    "1542838132-92c53300491e", "1571019613454-1cb2f99b2d8b", "1490818387583-1baba5e638af",
    "1519681393784-d120267933ba", "1499209974431-9dddcece7f88", "1516589178581-6cd7833ae3b2",
  ],
  // Editorial / beauty studio portfolio: high-end beauty, lips, skincare, fashion
  editorial: [
    "1596462502278-27bfdc403348", "1522335789203-aaa7d50d3b86", "1556228578-8c89e6adf883",
    "1571781926291-c477ebfd024b", "1597586124394-fbd6ef244026", "1487412947147-5cebf100ffc2",
    "1556228852-80b6e5eeff06", "1522335789203-aaa7d50d3b86", "1556909114-f6e7ad7d3136",
    "1583001931096-959e9a1a6223", "1610992015732-2449b76344bc", "1571781926291-c477ebfd024b",
  ],
  // Portraits — for team, leadership, testimonial avatars
  portrait: [
    "1494790108377-be9c29b29330", "1500648767791-00dcc994a43e", "1438761681033-6461ffad8d80",
    "1472099645785-5658abf4ff4e", "1580489944761-15a19d654956", "1531746020798-e6953c6e8e04",
    "1573496359142-b8d87734a5a2", "1517841905240-472988babdf9", "1534528741775-53994a69daeb",
    "1544005313-94ddf0286df2", "1607746882042-944635dfe10e", "1492562080023-ab3db95bfbce",
  ],
  // Trades / skilled services — tools, construction, electrical, plumbing, carpentry, contractors
  trades: [
    "1504917595217-d4dc5ebe6122", "1581094288338-2314dddb7ece", "1503387762-cf76f7d1f9be",
    "1517490232338-06b912a786b5", "1565008447742-97f6f38c985c", "1581094794329-c8112a89af12",
    "1572297983-5c3d96ad95a3", "1581092446327-9b52bd1570c2", "1581094272901-8a5b8c4e7d83",
    "1530124566582-a618bc2615dc", "1581093588401-fbb62a02f120", "1503387762-cf76f7d1f9be",
  ],
  // Automotive / transportation — cars, garages, mechanics, fleet, luxury vehicles
  automotive: [
    "1583121274602-3e2820c69888", "1502877338535-766e1452684a", "1492144534655-ae79c964c9d7",
    "1494976388531-d1058494cdd8", "1493238792000-8113da705763", "1503376780353-7e6692767b70",
    "1542362567-b07e54358753", "1485291571150-772bcfc10da5", "1503376780353-7e6692767b70",
    "1552519507-da3b142c6e3d", "1492144534655-ae79c964c9d7", "1583121274602-3e2820c69888",
  ],
  // Food/candy/bakery/confectionery -- added specifically because no
  // existing category covers this. Each ID individually verified by
  // fetching the actual Unsplash photo page (not guessed): candy-coated
  // chocolates, candy jars, candy eggs, lollipops, gummy bears, and a
  // macaron display case. Covers candy shops, bakeries, confectioners,
  // and similar food/dessert-forward businesses.
  food: [
    "1756092790115-5dbcf8f2d2e2", "1675789378281-f3280da92abe", "1744368643361-5c0f715ed751",
    "1532117364815-720cd35ff6e3", "1635342219731-4ae2bf39e1e9", "1760124056928-a9960b1b1dd2",
  ],
  // Default — generic office/workspace fallback
  default: [
    "1497366216548-37526070297c", "1497366754035-f200968a6e72", "1497366811353-6870744d04b2",
    "1497032628192-86f99bcd76bc", "1542744173-8e7e53415bb0", "1556761175-5973dc0f32e7",
  ],
};

// Pick a deterministic image from a category based on seed (so same seed always returns same image)
const pickImage = (category, seed, w, h) => {
  const list = IMAGE_LIBRARY[category] || IMAGE_LIBRARY.default;
  let hash = 0;
  const s = String(seed || "x");
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % list.length;
  return `https://images.unsplash.com/photo-${list[idx]}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
};

// Returns the provided URL, or a category-appropriate Unsplash photo as fallback.
// Category steers the type of image (marketing/production/product/lifestyle/editorial/portrait).
//
// Default category deliberately changed from "editorial" to "default".
// "editorial" specifically means beauty/skincare/fashion photography (see
// IMAGE_LIBRARY above) -- it was never meant to be a generic catch-all, but
// as the function's own PARAMETER default, any call site that doesn't
// explicitly pass a category (or passes undefined) silently got fashion/
// beauty imagery regardless of what the actual business was. Confirmed
// this independently of and in addition to the earlier BLANK_BRAND.
// imageCategory fix (f7649cc) -- that fix addressed the object-level
// default; this is a separate layer (the function's own parameter
// default) that call site can still fall through to if imageCategory
// isn't correctly threaded all the way to render time for any reason.
// Found while investigating a candy/kids-themed site that was showing a
// fashion bomber jacket and an actual skincare brand's product photo
// (visible branding included) -- both images live in exactly this
// "editorial" pool, strongly indicating this default was what got hit.
export const imgOrPlaceholder = (url, seed, w = 800, h = 1000, category = "default") => {
  if (url && url.trim()) return url.trim();
  return pickImage(category, seed, w, h);
};

// "editorial" is a valid entry in the AI's imageCategory enum, which means
// the validation step ({r.imageCategory} in the allowed list) passes it
// straight through even when the AI's choice was wrong. Confirmed live: a
// "candy bar for kids" project ended up with a fashion jacket and an
// actual skincare brand's product photo, both from the editorial pool
// (beauty/skincare/fashion), despite the prompt explicitly instructing
// "editorial is beauty/skincare/fashion photography specifically -- do
// NOT use it as a generic catch-all". That's the AI's own judgment being
// unreliable for one narrow, high-risk category, not a case of ignoring
// an explicit user request the way colors or fonts are -- nobody ever
// types "use editorial images". A lightweight sanity check is enough:
// only act on "editorial" specifically, and only when the raw description
// has zero textual signal of actually being beauty/skincare/fashion
// related.
const BEAUTY_SIGNAL_WORDS = [
  "beauty", "skincare", "skin care", "makeup", "cosmetic", "cosmetics",
  "salon", "spa", "esthetician", "aesthetician", "facial", "fashion",
  "apparel", "boutique clothing", "stylist", "hair", "nail", "lash",
  "brow", "waxing", "dermatology",
];

// Signal words for the "food" category -- used to redirect a wrongly-
// chosen "editorial" toward something actually relevant rather than just
// the generic "default" office/workspace fallback. Downgrading to
// "default" stops the WRONG (embarrassing, off-brand) images from
// showing, but a candy shop showing generic office stock photos is still
// not the actual candy imagery the theme calls for -- confirmed live,
// reported directly: "there's no images of candy eventhough i
// regenerated it". "default" is the correct fallback when nothing fits;
// "food" should be preferred over it whenever there's real signal the
// theme actually is food/dessert/confectionery related.
const FOOD_SIGNAL_WORDS = [
  "candy", "candies", "sweet", "sweets", "confection", "confectionery",
  "chocolate", "bakery", "bake shop", "dessert", "pastry", "pastries",
  "cake", "cookie", "cookies", "donut", "doughnut", "ice cream",
  "gelato", "lollipop", "gummy", "gummies", "snack", "snacks", "treat",
  "treats", "food", "cafe", "café", "coffee shop", "restaurant",
  "diner", "eatery", "kitchen", "culinary", "cuisine",
];

export function sanitizeImageCategory(category, rawInput) {
  if (category !== "editorial") return category;
  const lower = String(rawInput || "").toLowerCase();
  if (BEAUTY_SIGNAL_WORDS.some(w => lower.includes(w))) return "editorial";
  if (FOOD_SIGNAL_WORDS.some(w => lower.includes(w))) return "food";
  return "default";
}
