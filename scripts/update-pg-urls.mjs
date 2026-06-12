/**
 * Updates all listing URLs to point to PropertyGuru search pages.
 *
 * For listings where we have a specific PropertyGuru listing URL, we use that directly.
 * For all others, we generate a pre-filled PropertyGuru search URL so users land directly
 * on the relevant search results rather than an empty homeup.sg page.
 *
 * To run: node scripts/update-pg-urls.mjs
 * To add more specific PG URLs: add the slug → url mapping to KNOWN_PG_URLS below.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsPath = path.join(__dirname, "..", "lib", "data", "listings.ts");

// ─── Known specific PropertyGuru listing URLs ──────────────────────────────
// Add entries here as: "homeup-slug": "https://www.propertyguru.com.sg/listing/..."
const KNOWN_PG_URLS = {
  "160-woodlands-street-13": "https://www.propertyguru.com.sg/listing/hdb-for-sale-160-woodlands-street-13-500166916",
  "175-ang-mo-kio-avenue-4": "https://www.propertyguru.com.sg/listing/hdb-for-sale-175-ang-mo-kio-avenue-4-500150255",
  "309-bukit-batok-street-31": "https://www.propertyguru.com.sg/listing/hdb-for-sale-309-bukit-batok-street-31-500143079",
  "319-bukit-batok-street-33": "https://www.propertyguru.com.sg/listing/hdb-for-sale-319-bukit-batok-street-33-500030555",
  "371-bukit-batok-street-31": "https://www.propertyguru.com.sg/listing/hdb-for-sale-371-bukit-batok-street-31-500165902",
  "377a-hougang-street-32": "https://www.propertyguru.com.sg/listing/hdb-for-sale-377a-hougang-street-32-500139783",
  "406-choa-chu-kang-avenue-3": "https://www.propertyguru.com.sg/listing/hdb-for-sale-406-choa-chu-kang-avenue-3-500167112",
  "430a-yishun-avenue-11": "https://www.propertyguru.com.sg/listing/hdb-for-sale-430a-yishun-avenue-11-500160565",
  "476a-upper-serangoon-view": "https://www.propertyguru.com.sg/listing/hdb-for-sale-476a-upper-serangoon-view-500140336",
  "477-pasir-ris-drive-6": "https://www.propertyguru.com.sg/listing/hdb-for-sale-477-pasir-ris-drive-6-500043353",
  "547a-segar-road": "https://www.propertyguru.com.sg/listing/hdb-for-sale-547a-segar-road-500143515",
  "68-geylang-bahru": "https://www.propertyguru.com.sg/listing/hdb-for-sale-68-geylang-bahru-500156541",
  "699c-hougang-street-52": "https://www.propertyguru.com.sg/listing/hdb-for-sale-699c-hougang-street-52-500167646",
  "890a-tampines-avenue-1": "https://www.propertyguru.com.sg/listing/hdb-for-sale-890a-tampines-avenue-1-500120568",
  "citylights": "https://www.propertyguru.com.sg/listing/for-sale-citylights-500169182",
  "clavon": "https://www.propertyguru.com.sg/listing/for-sale-clavon-500165931",
  "dover-parkview": "https://www.propertyguru.com.sg/listing/for-sale-dover-parkview-500164693",
  "ecopolitan": "https://www.propertyguru.com.sg/listing/for-sale-ecopolitan-500167641",
  "flo-residence": "https://www.propertyguru.com.sg/listing/for-sale-flo-residence-60011979",
  "hdb-134-bedok-reservoir-road": "https://www.propertyguru.com.sg/listing/hdb-for-sale-132-bedok-reservoir-road-60216273",
  "hdb-377b-hougang-street-32": "https://www.propertyguru.com.sg/listing/hdb-for-sale-377b-hougang-street-32-500043096",
  "hdb-484-choa-chu-kang-ave-5": "https://www.propertyguru.com.sg/listing/hdb-for-sale-408-choa-chu-kang-avenue-3-500095518",
  "hdb-494g-tampines-street-45": "https://www.propertyguru.com.sg/listing/hdb-for-sale-494g-tampines-street-45-500126621",
  "hdb-643-yishun-street-61": "https://www.propertyguru.com.sg/listing/hdb-for-sale-643-yishun-street-61-500076214",
  "jool-suites": "https://www.propertyguru.com.sg/listing/for-sale-jool-suites-500161004",
  "piccadilly-grand": "https://www.propertyguru.com.sg/listing/for-sale-piccadilly-grand-25463680",
  "tembusu-grand": "https://www.propertyguru.com.sg/listing/for-sale-tembusu-grand-500132236",
  "tembusu-grand-2": "https://www.propertyguru.com.sg/listing/for-sale-tembusu-grand-500132236",
  "tembusu-grand-3": "https://www.propertyguru.com.sg/listing/for-sale-tembusu-grand-500132236",
  "the-tapestry": "https://www.propertyguru.com.sg/listing/for-rent-the-tapestry-500085874",
  "the-vales": "https://www.propertyguru.com.sg/listing/for-rent-the-vales-25121733",
  "the-waterline": "https://www.propertyguru.com.sg/listing/for-sale-the-waterline-500157257",
  "waterbay": "https://www.propertyguru.com.sg/listing/for-rent-kingsford-waterbay-24490665",
};
// ──────────────────────────────────────────────────────────────────────────

const content = readFileSync(listingsPath, "utf8");

// Pull out the LISTINGS array text and eval it (safe — it's our own generated TS file)
const arrayMatch = content.match(
  /export const LISTINGS: Listing\[\] = (\[[\s\S]+?\]);\s*$/m
);
if (!arrayMatch) {
  console.error("❌  Could not locate LISTINGS array in listings.ts");
  process.exit(1);
}

let listings;
try {
  // eslint-disable-next-line no-eval
  listings = eval("(" + arrayMatch[1] + ")");
} catch (e) {
  console.error("❌  Failed to parse LISTINGS array:", e.message);
  process.exit(1);
}

let specificCount = 0;
let searchCount = 0;

const updated = listings.map((l) => {
  // Decode HTML entities in name for a cleaner search query
  const cleanName = l.name
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();

  // Use a known specific PropertyGuru URL if we have one
  if (KNOWN_PG_URLS[l.slug]) {
    specificCount++;
    return { ...l, url: KNOWN_PG_URLS[l.slug] };
  }

  // Otherwise build a pre-filled PropertyGuru search URL
  const searchSection =
    l.status === "For Rent" ? "property-for-rent" : "property-for-sale";
  const freetext = encodeURIComponent(cleanName);
  const pgUrl = `https://www.propertyguru.com.sg/${searchSection}?freetext=${freetext}`;

  searchCount++;
  return { ...l, url: pgUrl };
});

// Reconstruct the file, preserving everything before the LISTINGS array
const beforeArray = content.slice(
  0,
  content.indexOf("export const LISTINGS:")
);
const listingsStr = JSON.stringify(updated, null, 2);

const newContent =
  beforeArray + "export const LISTINGS: Listing[] = " + listingsStr + ";\n";

writeFileSync(listingsPath, newContent, "utf8");

console.log(`✅  Updated ${updated.length} listing URLs:`);
console.log(`   • ${specificCount} with specific PropertyGuru listing URLs`);
console.log(`   • ${searchCount} with pre-filled PropertyGuru search URLs`);
console.log(
  "\n💡  To add a specific PG URL for a listing, find the slug in lib/data/listings.ts"
);
console.log(
  "   and add it to KNOWN_PG_URLS in scripts/update-pg-urls.mjs, then re-run this script."
);
