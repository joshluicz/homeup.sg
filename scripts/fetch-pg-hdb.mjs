/**
 * Fast HDB-only PropertyGuru URL finder.
 *
 * For HDB listings with specific block+street addresses, the first
 * PropertyGuru search result is always the right one (address is unique).
 * No CEA verification needed — much faster, no rate limit hits.
 *
 * Run: node scripts/fetch-pg-hdb.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsPath = path.join(__dirname, "..", "lib", "data", "listings.ts");

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchPGFirst(name, status) {
  const section = status === "For Rent" ? "property-for-rent" : "property-for-sale";
  // Strip "HDB " prefix if present
  const cleanName = name
    .replace(/^hdb\s+/i, "")
    .replace(/&#8211;/g, "-").replace(/&amp;/g, "&").trim();

  try {
    const res = await fetch(
      `https://www.propertyguru.com.sg/${section}?freetext=${encodeURIComponent(cleanName)}`,
      { headers: { "User-Agent": UA, "Accept-Language": "en-SG,en;q=0.9" } }
    );
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/listing\/([a-z0-9-]+-\d+)/);
    return m ? `https://www.propertyguru.com.sg/listing/${m[1]}` : null;
  } catch { return null; }
}

function looksLikeHdbAddress(name) {
  return /\d/.test(name) &&
    /street|avenue|drive|road|place|crescent|lane|way|close|ring|circle|view|plains|link|walk|rise|edgefield|buangkok|balam|geylang|tampines|yishun|woodlands|hougang|punggol|sengkang|bishan|serangoon|clementi|jurong|choa|batok|pasir|bedok|ang mo kio|toa payoh|whampoa|jalan|lorong/i.test(name);
}

const content = readFileSync(listingsPath, "utf8");
const arrayMatch = content.match(/export const LISTINGS: Listing\[\] = (\[[\s\S]+?\]);\s*$/m);
// eslint-disable-next-line no-eval
const listings = eval("(" + arrayMatch[1] + ")");

const toProcess = listings.filter(l =>
  !l.url.startsWith("https://www.propertyguru.com.sg/listing/") &&
  l.type === "HDB" &&
  looksLikeHdbAddress(l.name)
);

console.log(`🏠  Processing ${toProcess.length} HDB address listings …\n`);

let matched = 0;

for (const l of toProcess) {
  const cleanName = l.name
    .replace(/^hdb\s+blk\s+/i, "")
    .replace(/^hdb\s+/i, "")
    .replace(/&#8211;/g, "-").replace(/&amp;/g, "&").trim();

  process.stdout.write(`  ${cleanName} … `);
  const url = await searchPGFirst(cleanName, l.status);

  if (url) {
    console.log(`✅  ${url}`);
    const idx = listings.findIndex(x => x.id === l.id);
    listings[idx] = { ...l, url };
    matched++;
  } else {
    console.log("🔶 not found");
  }
  await sleep(1_200);
}

// Save
const beforeArray = content.slice(0, content.indexOf("export const LISTINGS:"));
const newContent = beforeArray + "export const LISTINGS: Listing[] = " + JSON.stringify(listings, null, 2) + ";\n";
writeFileSync(listingsPath, newContent, "utf8");

const totalSpecific = listings.filter(l => l.url.startsWith("https://www.propertyguru.com.sg/listing/")).length;
console.log(`\n✅  ${matched} HDB listings updated  |  ${totalSpecific} total specific PG URLs`);
