/**
 * fetch-listings.mjs
 * Fetches all property listings from homeup.sg WordPress API and generates
 * lib/data/listings.ts with correct images, URLs, and property types.
 *
 * Usage: node scripts/fetch-listings.mjs
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_API = "https://homeup.sg/wp-json/wp/v2";

// ── Known prices from the live listing page ──────────────────────────────────
const KNOWN_DATA = {
  "citylights":                    { price: "Contact for Price", priceValue: 0, beds: null, baths: null, size: "—", sizeValue: 0 },
  "ecopolitan":                    { price: "$1,850,000", priceValue: 1_850_000, beds: null, baths: null, size: "1,195 sqft", sizeValue: 1195 },
  "371-bukit-batok-street-31":     { price: "$409,000", priceValue: 409_000, beds: 2, baths: 2, size: "689 sqft", sizeValue: 689 },
  "the-verandah-residences-rental":{ price: "$3,500 / mo", priceValue: 3_500, beds: null, baths: null, size: "474 sqft", sizeValue: 474 },
  "the-trilinq-rental":            { price: "$3,999 / mo", priceValue: 3_999, beds: null, baths: null, size: "710 sqft", sizeValue: 710 },
  "dover-parkview":                { price: "$1,488,000", priceValue: 1_488_000, beds: null, baths: null, size: "969 sqft", sizeValue: 969 },
  "477-pasir-ris-drive-6":         { price: "Contact for Price", priceValue: 0, beds: null, baths: null, size: "—", sizeValue: 0 },
  "406-choa-chu-kang-avenue-3":    { price: "$539,999", priceValue: 539_999, beds: 3, baths: 2, size: "1,119 sqft", sizeValue: 1119 },
  "547a-segar-road":               { price: "$619,000", priceValue: 619_000, beds: 3, baths: 2, size: "989 sqft", sizeValue: 989 },
  "the-topiary":                   { price: "$1,499,999", priceValue: 1_499_999, beds: 3, baths: 2, size: "915 sqft", sizeValue: 915 },
  "jool-suites":                   { price: "$999,999", priceValue: 999_999, beds: 1, baths: 2, size: "700 sqft", sizeValue: 700 },
  "68-geylang-bahru":              { price: "$438,888", priceValue: 438_888, beds: 2, baths: 1, size: "700 sqft", sizeValue: 700 },
  "dixoras":                       { price: "$1,450,000", priceValue: 1_450_000, beds: 2, baths: 2, size: "840 sqft", sizeValue: 840 },
  "the-botany-at-dairy-farm":      { price: "$2,398,000", priceValue: 2_398_000, beds: 3, baths: 2, size: "1,033 sqft", sizeValue: 1033 },
  "bartley-vue":                   { price: "$2,299,900", priceValue: 2_299_900, beds: null, baths: null, size: "947 sqft", sizeValue: 947 },
  "eight-riversuites-2":           { price: "$2,699,000", priceValue: 2_699_000, beds: null, baths: null, size: "1,356 sqft", sizeValue: 1356 },
  "oleander-towers":               { price: "$1,899,000", priceValue: 1_899_000, beds: 3, baths: 3, size: "1,151 sqft", sizeValue: 1151 },
  "arc-at-tampines-2":             { price: "$5,500 / mo", priceValue: 5_500, beds: 3, baths: 3, size: "1,679 sqft", sizeValue: 1679 },
  "novelis-novena":                { price: "$1,880,000", priceValue: 1_880_000, beds: 2, baths: 2, size: "839 sqft", sizeValue: 839 },
  "cairnhill-residences":          { price: "$3,400,000", priceValue: 3_400_000, beds: 3, baths: 3, size: "1,174 sqft", sizeValue: 1174 },
};

// ── Determine property type from slug/title ──────────────────────────────────
const HDB_SLUGS = new Set([
  "hdb-28-balam-rd","309-bukit-batok-street-31","175-ang-mo-kio-avenue-4",
  "476a-upper-serangoon-view","699c-hougang-street-52","377a-hougang-street-32",
  "319-bukit-batok-street-33","hdb-134-bedok-reservoir-road","hdb-408-hougang-ave-10",
  "hdb-919-hougang-ave-4","hdb-431a-bedok-north-rd","hdb-643-yishun-street-61",
  "hdb-635a-senja-rd","hdb-491f-tampines-st-45","hdb-484-choa-chu-kang-ave-5",
  "hdb-678c-jurong-west-st-64","hdb-524-woodlands-dr-14","hdb-145-mei-ling-st",
  "hdb-494g-tampines-street-45","hdb-244-bt-batok-east-ave-5","160-woodlands-street-13",
  "hdb-578-hougang-ave-4","140-bukit-batok-street-11","hdb-422b-northshore-dr",
  "15-teck-whye-lane","107b-jalan-tenteram","hdb-82-whampoa-dr","115-clementi-street-13",
  "176c-edgefield-plains","23-hougang-avenue-3","hdb-blk-548b-segar-rd",
  "788d-woodlands-crescent","204-bukit-batok-street-21","608a-tampines-north-drive-1",
  "hdb-139-bedok-north-ave-3","hdb-679a-punggol-drive","hdb-450-yishun-ring-road",
  "894-tampines-street-81","997b-buangkok-crescent","hdb-415b-fernvale-link",
  "hdb-blk-920-jurong-west-st-92","435-yishun-avenue-6","596a-ang-mo-kio-street-52",
  "907-jurong-west-st-91","463b-bt-batok-st-41","8a-upper-boon-keng-road",
  "738-woodlands-circle","986b-buangkok-crescent","709-yishun-avenue-5",
  "605a-tampines-st-61","90-tanglin-halt-road","189c-rivervale-drive",
  "804-woodlands-street-81","hdb-blk-314b-anchorvale-link","hdb-812b-choa-chu-kang-avenue-7",
  "126a-edgedale-plains","115-potong-pasir-avenue-1","194-westwood-residence",
  "138-tampines-street-11","286-choa-chu-kang-avenue-3","hdb-551-choa-chu-kang-st-52",
  "139b-lorong-1a-toa-payoh","471b-upper-serangoon-crescent","807-tampines-avenue-4",
  "35-bedok-south-avenue-2","428-tampines-street-41","blk-403d-fernvale-lane",
  "hdb-blk-818-tampines","hdb-blk-314b-anchorvale-link","212-choa-chu-kang-central",
  "440c-clementi-avenue-3","117b-jalan-tenteram",
  "377a-hougang-street-32","430a-yishun-avenue-11","hdb-377b-hougang-street-32",
  "890a-tampines-avenue-1","547a-segar-road","406-choa-chu-kang-avenue-3",
  "371-bukit-batok-street-31","68-geylang-bahru","477-pasir-ris-drive-6",
]);

const LANDED_SLUGS = new Set([
  "semi-d-luxus-hills","dgrove-villas","loyang-villas","39-wak-hassan-drive",
  "12-pine-close","belgravia-green",
]);

function getPropertyType(slug, title) {
  if (LANDED_SLUGS.has(slug)) return "Landed";
  if (HDB_SLUGS.has(slug)) return "HDB";
  if (slug.startsWith("hdb-") || slug.includes("-hdb-")) return "HDB";
  // Check title for HDB patterns
  if (/\b(hdb|blk|block)\b/i.test(title)) return "HDB";
  if (/^\d+[a-z]?\s+(bukit|hougang|tampines|yishun|jurong|bedok|ang mo kio|woodlands|clementi|choa chu kang|sengkang|punggol|serangoon|bishan|toa payoh|geylang|kallang|queenstown|pasir ris|redhill)/i.test(title)) return "HDB";
  return "Condo";
}

// Rental detection
function isRental(slug, title) {
  return slug.includes("-rental") || /rental/i.test(title);
}

// ── District inference from slug ─────────────────────────────────────────────
function getDistrict(slug, title) {
  const s = slug.toLowerCase();
  const t = title.toLowerCase();
  if (s.includes("tampines") || t.includes("tampines")) return "Tampines";
  if (s.includes("yishun") || t.includes("yishun")) return "Yishun";
  if (s.includes("hougang") || t.includes("hougang")) return "Hougang";
  if (s.includes("woodlands") || t.includes("woodlands")) return "Woodlands";
  if (s.includes("jurong") || t.includes("jurong")) return "Jurong";
  if (s.includes("bedok") || t.includes("bedok")) return "Bedok";
  if (s.includes("ang-mo-kio") || t.includes("ang mo kio")) return "Ang Mo Kio";
  if (s.includes("bukit-batok") || t.includes("bukit batok")) return "Bukit Batok";
  if (s.includes("bukit-timah") || t.includes("bukit timah")) return "Bukit Timah";
  if (s.includes("sengkang") || t.includes("sengkang")) return "Sengkang";
  if (s.includes("punggol") || t.includes("punggol")) return "Punggol";
  if (s.includes("clementi") || t.includes("clementi")) return "Clementi";
  if (s.includes("serangoon") || t.includes("serangoon")) return "Serangoon";
  if (s.includes("bishan") || t.includes("bishan")) return "Bishan";
  if (s.includes("novena") || t.includes("novena")) return "Novena";
  if (s.includes("queenstown") || t.includes("queenstown")) return "Queenstown";
  if (s.includes("pasir-ris") || t.includes("pasir ris")) return "Pasir Ris";
  if (s.includes("choa-chu-kang") || t.includes("choa chu kang")) return "Choa Chu Kang";
  if (s.includes("geylang") || t.includes("geylang")) return "Geylang";
  if (s.includes("kallang") || t.includes("kallang")) return "Kallang";
  if (s.includes("toa-payoh") || t.includes("toa payoh")) return "Toa Payoh";
  if (s.includes("orchard") || t.includes("orchard")) return "Orchard";
  if (s.includes("river-valley") || t.includes("river valley")) return "River Valley";
  if (s.includes("harbourfront") || t.includes("harbourfront")) return "HarbourFront";
  if (s.includes("fernvale") || t.includes("fernvale")) return "Fernvale";
  if (s.includes("lentor") || t.includes("lentor")) return "Lentor";
  if (s.includes("bartley") || t.includes("bartley")) return "Bartley";
  if (s.includes("dover") || t.includes("dover")) return "Dover";
  if (s.includes("boon-keng") || t.includes("boon keng")) return "Boon Keng";
  if (s.includes("whampoa") || t.includes("whampoa")) return "Whampoa";
  if (s.includes("dairy-farm") || t.includes("dairy farm")) return "Dairy Farm";
  if (s.includes("keppel") || t.includes("keppel")) return "Keppel";
  if (s.includes("tanglin") || t.includes("tanglin")) return "Tanglin";
  if (s.includes("havelock") || t.includes("havelock")) return "Havelock";
  if (s.includes("macpherson") || t.includes("macpherson")) return "MacPherson";
  if (s.includes("rivervale") || t.includes("rivervale")) return "Rivervale";
  if (s.includes("buangkok") || t.includes("buangkok")) return "Buangkok";
  if (s.includes("upper-serangoon") || t.includes("upper serangoon")) return "Upper Serangoon";
  if (s.includes("anchorvale") || t.includes("anchorvale")) return "Anchorvale";
  if (s.includes("edgefield") || t.includes("edgefield")) return "Punggol";
  if (s.includes("edgedale") || t.includes("edgedale")) return "Punggol";
  if (s.includes("northshore") || t.includes("northshore")) return "Punggol";
  if (s.includes("segar") || t.includes("segar")) return "Bukit Panjang";
  if (s.includes("teck-whye") || t.includes("teck whye")) return "Choa Chu Kang";
  if (s.includes("mei-ling") || t.includes("mei ling")) return "Queenstown";
  if (s.includes("loyang") || t.includes("loyang")) return "Pasir Ris";
  if (s.includes("wak-hassan") || t.includes("wak hassan")) return "Sembawang";
  if (s.includes("pine-close") || t.includes("pine close")) return "Thomson";
  if (s.includes("piccadilly") || t.includes("piccadilly")) return "Farrer Park";
  if (s.includes("midtown") || t.includes("midtown")) return "Bugis";
  if (s.includes("jalan-tenteram") || t.includes("jalan tenteram")) return "Toa Payoh";
  if (s.includes("potong-pasir") || t.includes("potong pasir")) return "Potong Pasir";
  if (s.includes("strathmore") || t.includes("strathmore")) return "Queenstown";
  if (s.includes("arcady") || t.includes("arcady")) return "Boon Keng";
  if (s.includes("upper-boon-keng") || t.includes("upper boon keng")) return "Boon Keng";
  if (s.includes("luxus") || t.includes("luxus")) return "Seletar";
  if (s.includes("dgrove") || t.includes("d'grove")) return "Buona Vista";
  return "Singapore";
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchAllProperties() {
  const allProps = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const batch = await fetchJSON(
        `${BASE_API}/property?per_page=100&page=${page}&_fields=id,title,slug,link,featured_media`
      );
      if (!batch.length) break;
      allProps.push(...batch);
      process.stdout.write(`Fetched page ${page}: ${batch.length} listings\n`);
      if (batch.length < 100) break;
    } catch {
      break;
    }
  }
  return allProps;
}

async function resolveImages(mediaIds) {
  const unique = [...new Set(mediaIds.filter(Boolean))];
  const imageMap = {};
  // Fetch in batches of 50
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const url = `${BASE_API}/media?include=${batch.join(",")}&per_page=50&_fields=id,source_url,media_details`;
    const items = await fetchJSON(url);
    for (const item of items) {
      // Prefer the 1024px large size, fall back to source
      const large = item.media_details?.sizes?.large?.source_url;
      const mediumLarge = item.media_details?.sizes?.medium_large?.source_url;
      imageMap[item.id] = large || mediumLarge || item.source_url;
    }
    process.stdout.write(`Resolved images ${i + 1}–${Math.min(i + 50, unique.length)}\n`);
  }
  return imageMap;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching all properties from homeup.sg...");
  const properties = await fetchAllProperties();
  console.log(`Total: ${properties.length} listings`);

  const mediaIds = properties.map((p) => p.featured_media).filter(Boolean);
  console.log("Resolving images...");
  const imageMap = await resolveImages(mediaIds);

  // Fallback images by type
  const FALLBACK = {
    HDB: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    Condo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    Landed: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  };

  const listings = properties.map((p, idx) => {
    const slug = p.slug;
    const title = p.title.rendered;
    const type = getPropertyType(slug, title);
    const known = KNOWN_DATA[slug] ?? {
      price: "Contact for Price",
      priceValue: 0,
      beds: null,
      baths: null,
      size: "—",
      sizeValue: 0,
    };
    const image = (p.featured_media && imageMap[p.featured_media])
      ? imageMap[p.featured_media]
      : FALLBACK[type];
    const status = isRental(slug, title) ? "For Rent" : "For Sale";
    const district = getDistrict(slug, title);

    return {
      id: idx + 1,
      name: title,
      slug,
      ...known,
      type,
      status,
      image,
      district,
      url: p.link,
    };
  });

  // Count by type
  const hdbCount = listings.filter((l) => l.type === "HDB").length;
  const condoCount = listings.filter((l) => l.type === "Condo").length;
  const landedCount = listings.filter((l) => l.type === "Landed").length;
  console.log(`\nHDB: ${hdbCount} | Condo: ${condoCount} | Landed: ${landedCount}`);

  // Generate TypeScript file
  const tsContent = `// AUTO-GENERATED by scripts/fetch-listings.mjs
// Last updated: ${new Date().toISOString().split("T")[0]}
// Total: ${listings.length} listings (HDB: ${hdbCount}, Condo: ${condoCount}, Landed: ${landedCount})
// To regenerate: node scripts/fetch-listings.mjs

export type PropertyType = "HDB" | "Condo" | "Landed";
export type ListingStatus = "For Sale" | "For Rent";

export interface Listing {
  id: number;
  name: string;
  slug: string;
  price: string;
  priceValue: number;
  beds: number | null;
  baths: number | null;
  size: string;
  sizeValue: number;
  type: PropertyType;
  status: ListingStatus;
  image: string;
  district?: string;
  url: string;
}

export const LISTINGS_URL = "https://homeup.sg/property-listing/";
export const WHATSAPP_NUMBER = "6580877015";

export const LISTINGS: Listing[] = ${JSON.stringify(listings, null, 2)};
`;

  const outPath = join(__dirname, "../lib/data/listings.ts");
  writeFileSync(outPath, tsContent, "utf8");
  console.log(`\nWritten to ${outPath}`);
}

main().catch(console.error);
