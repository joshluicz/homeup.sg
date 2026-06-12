/**
 * Efficiently fetches specific PropertyGuru listing URLs for every HomeUP listing.
 *
 * Strategy (much faster than per-property search):
 *   1. Query PropertyGuru filtered by each HomeUP agent's CEA number (for sale + for rent).
 *   2. Build a slug → URL map from all results.
 *   3. Match each listing in lib/data/listings.ts to the PropertyGuru URL by comparing slugs.
 *   4. Where no exact slug match, try fuzzy name matching.
 *   5. Update lib/data/listings.ts with the matched URLs.
 *
 * Run: node scripts/fetch-pg-urls-v2.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsPath = path.join(__dirname, "..", "lib", "data", "listings.ts");

// ─── HomeUP agent CEA numbers ──────────────────────────────────────────────
const HOMEUP_AGENTS = [
  { name: "Dennis Lim",    cea: "R055990G" },
  { name: "Yeo Tong Boon", cea: "R069651E" },
  { name: "Edmund Lee",    cea: "R023385H" },
  { name: "Kenji Ching",   cea: "R070948I" },
  { name: "Olivia Neo",    cea: "R072836A" },
];

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-SG,en;q=0.9",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return await res.text();
    console.warn(`  ⚠️  ${res.status} for ${url}`);
    return null;
  } catch (e) {
    console.warn(`  ⚠️  fetch error: ${e.message}`);
    return null;
  }
}

/**
 * Get all listing slugs from a PropertyGuru agent CEA page (one page = up to ~20 listings).
 * Returns an array of { slug, url } objects.
 */
async function fetchAgentListings(cea, type) {
  const section = type === "rent" ? "property-for-rent" : "property-for-sale";
  const slugSet = new Set();
  const results = [];

  // PropertyGuru paginates; check up to 5 pages
  for (let page = 1; page <= 5; page++) {
    const url = `https://www.propertyguru.com.sg/${section}?agentCea=${cea}&page=${page}`;
    const html = await fetchText(url);
    if (!html) break;

    const matches = [...html.matchAll(/listing\/([a-z0-9-]+-\d+)/g)];
    let newFound = false;
    for (const m of matches) {
      if (!slugSet.has(m[1])) {
        slugSet.add(m[1]);
        results.push({
          slug: m[1],
          url: `https://www.propertyguru.com.sg/listing/${m[1]}`,
        });
        newFound = true;
      }
    }
    if (!newFound) break; // no more pages
    await sleep(800);
  }
  return results;
}

/** Convert a PropertyGuru listing slug to a normalised key for matching. */
function slugToKey(pgSlug) {
  return pgSlug
    .replace(/^(hdb-for-sale-|hdb-for-rent-|for-sale-|for-rent-)/, "")
    .replace(/-\d+$/, "")          // remove trailing listing ID
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Convert a homeup.sg slug to a normalised key for matching. */
function homeupSlugToKey(slug) {
  return slug
    .replace(/-rental$/, "")        // strip "-rental" suffix used for rentals
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Main ──────────────────────────────────────────────────────────────────

// Read current listings.ts
const content = readFileSync(listingsPath, "utf8");
const arrayMatch = content.match(
  /export const LISTINGS: Listing\[\] = (\[[\s\S]+?\]);\s*$/m
);
if (!arrayMatch) {
  console.error("❌  Could not locate LISTINGS array in listings.ts");
  process.exit(1);
}
// eslint-disable-next-line no-eval
const listings = eval("(" + arrayMatch[1] + ")");

// ─── Step 1: Collect all PropertyGuru listing slugs for every HomeUP agent ─
console.log("📥  Fetching all HomeUP agent listings from PropertyGuru …\n");
const pgMap = new Map(); // normalised-key → full PG URL

for (const agent of HOMEUP_AGENTS) {
  for (const type of ["sale", "rent"]) {
    process.stdout.write(`  ${agent.name} (${agent.cea}) – ${type} … `);
    const items = await fetchAgentListings(agent.cea, type);
    for (const item of items) {
      const key = slugToKey(item.slug);
      if (!pgMap.has(key)) pgMap.set(key, item.url);
    }
    console.log(`${items.length} listings`);
    await sleep(1_200);
  }
}

console.log(`\n🔑  Total unique PropertyGuru listings collected: ${pgMap.size}`);
console.log("\n📋  PropertyGuru keys found:");
for (const [k, v] of pgMap) {
  console.log(`   ${k}  →  ${v}`);
}

// ─── Step 2: Match each homeup.sg listing to a PropertyGuru URL ────────────
console.log("\n🔗  Matching listings …\n");
let matched = 0;
let unmatched = 0;

const updated = listings.map((l) => {
  const homeupKey = homeupSlugToKey(l.slug);

  // Try exact key match first
  if (pgMap.has(homeupKey)) {
    matched++;
    const pgUrl = pgMap.get(homeupKey);
    console.log(`✅  ${l.name}  →  ${pgUrl}`);
    return { ...l, url: pgUrl };
  }

  // Try a looser match: is homeupKey a substring of any PG key or vice versa?
  let bestUrl = null;
  for (const [pgKey, pgUrl] of pgMap) {
    if (pgKey.includes(homeupKey) || homeupKey.includes(pgKey)) {
      bestUrl = pgUrl;
      break;
    }
  }
  if (bestUrl) {
    matched++;
    console.log(`🟡  ${l.name}  (fuzzy)  →  ${bestUrl}`);
    return { ...l, url: bestUrl };
  }

  unmatched++;
  console.log(`🔶  ${l.name}  – no match, keeping search URL`);
  return l;
});

// ─── Step 3: Write updated listings.ts ─────────────────────────────────────
const beforeArray = content.slice(0, content.indexOf("export const LISTINGS:"));
const listingsStr = JSON.stringify(updated, null, 2);
const newContent =
  beforeArray + "export const LISTINGS: Listing[] = " + listingsStr + ";\n";

writeFileSync(listingsPath, newContent, "utf8");

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅  Done!`);
console.log(`   • ${matched} listings matched to specific PropertyGuru URLs`);
console.log(`   • ${unmatched} listings kept search URL fallback`);
console.log(`   • lib/data/listings.ts updated`);
