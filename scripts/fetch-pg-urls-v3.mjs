/**
 * Smart PropertyGuru URL fetcher v3.
 *
 * Improvements over v2:
 *  - Skips listings that already have a specific PG listing URL.
 *  - For HDB block-address listings (e.g. "371 Bukit Batok Street 31"), uses slug
 *    pattern matching instead of CEA checks — much faster.
 *  - For condo/landed listings, checks first 6 candidates for HomeUP CEA.
 *  - Saves progress to a JSON file so you can resume without losing data.
 *  - Smarter back-off when rate-limited.
 *
 * Run:   node scripts/fetch-pg-urls-v3.mjs
 * Resume after interruption: just run the same command again.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsPath = path.join(__dirname, "..", "lib", "data", "listings.ts");
const progressPath = path.join(__dirname, "..", "lib", "data", "listings-pg-progress.json");

// HomeUP agent CEA numbers
const HOMEUP_CEA = new Set([
  "R055990G", // Dennis Lim
  "R069651E", // Yeo Tong Boon
  "R023385H", // Edmund Lee
  "R070948I", // Kenji Ching
  "R072836A", // Olivia Neo
]);

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const HEADERS = { "User-Agent": UA, "Accept-Language": "en-SG,en;q=0.9" };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let rateLimitHits = 0;

async function fetchText(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) { rateLimitHits = 0; return await res.text(); }
      if (res.status === 429 || res.status === 503) {
        rateLimitHits++;
        const wait = Math.min(30_000 * rateLimitHits, 120_000);
        process.stdout.write(` [RL ${wait/1000}s] `);
        await sleep(wait);
        continue;
      }
      return null;
    } catch { await sleep(3_000); }
  }
  return null;
}

/** Extract unique listing slugs from a PropertyGuru HTML page. */
function extractSlugs(html) {
  const seen = new Set();
  const slugs = [];
  for (const m of html.matchAll(/listing\/([a-z0-9-]+-\d+)/g)) {
    if (!seen.has(m[1])) { seen.add(m[1]); slugs.push(m[1]); }
  }
  return slugs;
}

/** Convert a name to a normalised, lowercase kebab key. */
function toKey(name) {
  return name
    .replace(/&#\d+;/g, c => { const n=parseInt(c.slice(2,-1)); return String.fromCharCode(n); })
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * For HDB block-address listings, construct an expected PG slug prefix.
 * e.g. "371 Bukit Batok Street 31" → "371-bukit-batok-street-31"
 *      "HDB 377B Hougang Street 32" → "377b-hougang-street-32"
 */
function hdbSlugPrefix(name) {
  return toKey(name.replace(/^hdb\s+/i, "").replace(/-rental$/i, ""));
}

/** Check whether a PropertyGuru listing page is by a HomeUP agent. */
async function isHomeUpListing(slug) {
  const html = await fetchText(`https://www.propertyguru.com.sg/listing/${slug}`);
  if (!html) return false;
  for (const cea of HOMEUP_CEA) { if (html.includes(cea)) return true; }
  return false;
}

/**
 * Return true if a name looks like an HDB block+street address that would uniquely
 * identify a unit (not just a development name like "Ecopolitan").
 */
function looksLikeHdbAddress(name) {
  // Must contain a number (block number) and "Street|Avenue|Drive|Road|Place|Crescent|Lane|Way|Close|Ring|Circle|View|Plains|Link|Walk|Rise"
  return /\d/.test(name) && /street|avenue|drive|road|place|crescent|lane|way|close|ring|circle|view|plains|link|walk|rise|edgefield|buangkok/i.test(name);
}

// ─── Main ──────────────────────────────────────────────────────────────────

// Read listings.ts
const content = readFileSync(listingsPath, "utf8");
const arrayMatch = content.match(/export const LISTINGS: Listing\[\] = (\[[\s\S]+?\]);\s*$/m);
if (!arrayMatch) { console.error("❌  Could not find LISTINGS array"); process.exit(1); }
// eslint-disable-next-line no-eval
const listings = eval("(" + arrayMatch[1] + ")");

// Load saved progress (slug → PG URL)
const progress = existsSync(progressPath)
  ? JSON.parse(readFileSync(progressPath, "utf8"))
  : {};

console.log(`📋  Loaded ${Object.keys(progress).length} previously saved PG URL matches.\n`);

// Count how many already have specific PG URLs
const alreadyDone = listings.filter(l =>
  l.url.startsWith("https://www.propertyguru.com.sg/listing/")
).length;
console.log(`✅  ${alreadyDone} listings already have specific PG URLs.\n`);

let newlyMatched = 0;

for (let i = 0; i < listings.length; i++) {
  const l = listings[i];

  // Skip listings that already have a specific PG listing URL
  if (l.url.startsWith("https://www.propertyguru.com.sg/listing/")) continue;
  // Skip if we already found this in a previous run
  if (progress[l.slug]) {
    listings[i] = { ...l, url: progress[l.slug] };
    newlyMatched++;
    continue;
  }

  const cleanName = l.name
    .replace(/&#8211;/g, "-").replace(/&#8212;/g, "—")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();

  process.stdout.write(`[${String(i+1).padStart(3,"0")}/${listings.length}] ${cleanName} … `);

  // ── Search PropertyGuru for this property ──────────────────────────────
  const section = l.status === "For Rent" ? "property-for-rent" : "property-for-sale";
  const html = await fetchText(
    `https://www.propertyguru.com.sg/${section}?freetext=${encodeURIComponent(cleanName)}`
  );
  await sleep(1_500);

  if (!html) { console.log("⚠️  fetch failed"); continue; }

  const slugs = extractSlugs(html).slice(0, 10);
  if (slugs.length === 0) { console.log("⚪ no results"); continue; }

  let found = null;

  // ── Strategy A: HDB address matching (no CEA check needed) ────────────
  if (l.type === "HDB" && looksLikeHdbAddress(cleanName)) {
    const expectedPrefix = hdbSlugPrefix(cleanName);
    for (const slug of slugs) {
      // Strip the transaction prefix and listing ID from PG slug
      const bodySlug = slug.replace(/^(hdb-for-sale-|hdb-for-rent-|for-sale-|for-rent-)/, "").replace(/-\d+$/, "");
      if (bodySlug === expectedPrefix || bodySlug.startsWith(expectedPrefix.slice(0, -2))) {
        found = `https://www.propertyguru.com.sg/listing/${slug}`;
        break;
      }
    }
  }

  // ── Strategy B: CEA check for first 6 candidates ──────────────────────
  if (!found) {
    for (const slug of slugs.slice(0, 6)) {
      const match = await isHomeUpListing(slug);
      await sleep(800);
      if (match) {
        found = `https://www.propertyguru.com.sg/listing/${slug}`;
        break;
      }
    }
  }

  if (found) {
    console.log(`✅  ${found}`);
    progress[l.slug] = found;
    listings[i] = { ...l, url: found };
    newlyMatched++;

    // Save progress after every match
    writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  } else {
    console.log("🔶 not found");
  }

  // Save listings.ts periodically (every 10 listings)
  if ((i + 1) % 10 === 0) {
    const beforeArray = content.slice(0, content.indexOf("export const LISTINGS:"));
    const newContent = beforeArray + "export const LISTINGS: Listing[] = " + JSON.stringify(listings, null, 2) + ";\n";
    writeFileSync(listingsPath, newContent, "utf8");
    console.log(`\n💾  Progress saved (${i+1}/${listings.length}) …\n`);
    await sleep(3_000);
  }
}

// Final save
const beforeArray = content.slice(0, content.indexOf("export const LISTINGS:"));
const newContent = beforeArray + "export const LISTINGS: Listing[] = " + JSON.stringify(listings, null, 2) + ";\n";
writeFileSync(listingsPath, newContent, "utf8");

const totalSpecific = listings.filter(l => l.url.startsWith("https://www.propertyguru.com.sg/listing/")).length;

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅  Done!`);
console.log(`   • ${newlyMatched} new listings matched this run`);
console.log(`   • ${totalSpecific} total listings now have specific PG URLs`);
console.log(`   • ${listings.length - totalSpecific} listings still using search URL fallback`);
console.log(`   • lib/data/listings.ts updated`);
console.log(`\n   Run again to retry any unmatched listings.`);
