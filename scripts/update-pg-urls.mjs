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
  "371-bukit-batok-street-31":
    "https://www.propertyguru.com.sg/listing/hdb-for-sale-371-bukit-batok-street-31-500165902",
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
