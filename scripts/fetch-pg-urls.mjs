/**
 * Fetches specific PropertyGuru listing URLs for every listing in lib/data/listings.ts.
 *
 * Strategy:
 *   1. For each listing, search PropertyGuru using its name.
 *   2. Collect all candidate listing slugs from the search results page.
 *   3. For each candidate, fetch the listing page and check if the agent
 *      belongs to HomeUP (by matching their CEA registration numbers).
 *   4. Store the first match found.
 *   5. Rewrite lib/data/listings.ts with the updated URLs.
 *
 * Run: node scripts/fetch-pg-urls.mjs
 *
 * Note: this makes HTTP requests to PropertyGuru. It includes rate-limiting
 * delays out of courtesy. Expected runtime: ~15–25 minutes for 179 listings.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsPath = path.join(__dirname, "..", "lib", "data", "listings.ts");

// ─── HomeUP agent CEA numbers ──────────────────────────────────────────────
const HOMEUP_CEA = new Set([
  "R055990G", // Dennis Lim
  "R069651E", // Yeo Tong Boon
  "R023385H", // Edmund Lee
  "R070948I", // Kenji Ching
  "R072836A", // Olivia Neo
]);

// PropertyGuru returns 403 for desktop User-Agent; mobile UA works fine.
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const FETCH_OPTS = {
  headers: {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-SG,en;q=0.9",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch a URL and return its text body, or null on error. */
async function fetchText(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, FETCH_OPTS);
      if (res.ok) return await res.text();
      if (res.status === 429) {
        console.warn(`  ⏳ Rate limited – waiting 30s …`);
        await sleep(30_000);
        continue;
      }
      return null;
    } catch {
      if (attempt < retries) await sleep(3_000);
    }
  }
  return null;
}

/**
 * Search PropertyGuru for a property name + sale/rent type.
 * Returns an array of deduplicated listing slugs (e.g. "for-sale-ecopolitan-500167641").
 */
async function searchPG(name, status) {
  const section =
    status === "For Rent" ? "property-for-rent" : "property-for-sale";
  const q = encodeURIComponent(name);
  const url = `https://www.propertyguru.com.sg/${section}?freetext=${q}`;

  const html = await fetchText(url);
  if (!html) return [];

  // Extract listing slugs from href values
  const slugRe = /listing\/([a-z0-9-]+-\d+)/g;
  const seen = new Set();
  const slugs = [];
  let m;
  while ((m = slugRe.exec(html)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      slugs.push(m[1]);
    }
  }
  return slugs;
}

/**
 * Check whether a PropertyGuru listing belongs to a HomeUP agent.
 * Returns the full URL if it matches, or null.
 */
async function findHomeUpListing(slugs) {
  for (const slug of slugs) {
    const url = `https://www.propertyguru.com.sg/listing/${slug}`;
    const html = await fetchText(url);
    if (!html) continue;
    await sleep(600); // polite delay between listing fetches

    // Check for any HomeUP CEA number in the page source
    for (const cea of HOMEUP_CEA) {
      if (html.includes(cea)) {
        return url;
      }
    }
  }
  return null;
}

// ─── Main ──────────────────────────────────────────────────────────────────

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

const results = [];
let found = 0;
let notFound = 0;

console.log(`🔍  Searching PropertyGuru for ${listings.length} listings …\n`);

for (let i = 0; i < listings.length; i++) {
  const l = listings[i];
  const cleanName = l.name
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();

  process.stdout.write(
    `[${String(i + 1).padStart(3, "0")}/${listings.length}] ${cleanName} … `
  );

  // Step 1: search
  const slugs = await searchPG(cleanName, l.status);
  await sleep(1_200); // polite delay between searches

  if (slugs.length === 0) {
    console.log("⚪ no results");
    notFound++;
    results.push(l);
    continue;
  }

  // Step 2: check each candidate for a HomeUP agent
  // Only check up to the first 12 candidates to avoid excessive requests
  const candidates = slugs.slice(0, 12);
  const pgUrl = await findHomeUpListing(candidates);

  if (pgUrl) {
    console.log(`✅  ${pgUrl}`);
    found++;
    results.push({ ...l, url: pgUrl });
  } else {
    // Fall back to pre-filled search URL (already set in previous script)
    console.log("🔶 no HomeUP listing found — keeping search URL");
    notFound++;
    results.push(l);
  }

  // Extra polite pause every 10 listings
  if ((i + 1) % 10 === 0) {
    console.log(`\n⏸️  Pausing 5 s …\n`);
    await sleep(5_000);
  }
}

// Reconstruct the TypeScript file
const beforeArray = content.slice(0, content.indexOf("export const LISTINGS:"));
const listingsStr = JSON.stringify(results, null, 2);
const newContent =
  beforeArray + "export const LISTINGS: Listing[] = " + listingsStr + ";\n";

writeFileSync(listingsPath, newContent, "utf8");

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅  Done!`);
console.log(`   • ${found} listings updated with specific PropertyGuru URLs`);
console.log(`   • ${notFound} listings kept search URL fallback`);
console.log(`   • lib/data/listings.ts updated`);
