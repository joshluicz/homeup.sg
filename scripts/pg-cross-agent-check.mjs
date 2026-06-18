/**
 * Cross-agent duplicate check for PG sources and listings.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function propertySlugFromUrl(url) {
  const m = url.match(/\/listing\/(?:hdb-for-(?:sale|rent)-|for-(?:sale|rent)-)?(.+)-\d{6,}$/);
  if (!m) return null;
  return m[1];
}

function listedAsFromUrl(url) {
  return /for-rent/i.test(url) ? "rent" : "sell";
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: sources } = await supabase
  .from("pg_listing_sources")
  .select("agent_slug, pg_url, pg_listing_id");

const { data: listings } = await supabase
  .from("listings")
  .select("title, slug, listed_as, source_pg_url, source_pg_listing_id, status")
  .is("deleted_at", null);

console.log("=== CROSS-AGENT DUPLICATE CHECK ===\n");
console.log(`Sources: ${sources?.length ?? 0}`);
console.log(`Active listings: ${listings?.length ?? 0}\n`);

const byAgent = {};
for (const s of sources ?? []) {
  byAgent[s.agent_slug] = (byAgent[s.agent_slug] ?? 0) + 1;
}
console.log("Sources per agent:", byAgent);

// Same property key (slug + listed_as) under multiple agents in sources
const sourceByKey = new Map();
const crossAgentSources = [];

for (const s of sources ?? []) {
  const prop = propertySlugFromUrl(s.pg_url);
  const la = listedAsFromUrl(s.pg_url);
  if (!prop) continue;
  const key = `${la}:${prop}`;
  const prev = sourceByKey.get(key);
  if (prev && prev.agent_slug !== s.agent_slug) {
    crossAgentSources.push({ key, a: prev, b: s });
  } else if (!prev) {
    sourceByKey.set(key, s);
  }
}

console.log(`\nSame property listed under BOTH agents in pg_listing_sources: ${crossAgentSources.length}`);
for (const { key, a, b } of crossAgentSources.slice(0, 15)) {
  console.log(`  ${key}`);
  console.log(`    ${a.agent_slug}: ${a.pg_listing_id}`);
  console.log(`    ${b.agent_slug}: ${b.pg_listing_id}`);
}
if (crossAgentSources.length > 15) {
  console.log(`  ... and ${crossAgentSources.length - 15} more`);
}

// Unique property keys across all sources
const uniquePropertyKeys = new Set();
for (const s of sources ?? []) {
  const prop = propertySlugFromUrl(s.pg_url);
  const la = listedAsFromUrl(s.pg_url);
  if (prop) uniquePropertyKeys.add(`${la}:${prop}`);
}

console.log(`\nUnique properties in sources (listed_as + slug): ${uniquePropertyKeys.size}`);

// Listings: duplicate titles / property slugs
const listingByTitle = new Map();
const dupTitles = [];
for (const l of listings ?? []) {
  const t = l.title.trim().toLowerCase();
  if (listingByTitle.has(t)) {
    dupTitles.push([listingByTitle.get(t), l]);
  } else {
    listingByTitle.set(t, l);
  }
}

console.log(`\nListings with duplicate titles (sale+rent pairs): ${dupTitles.length}`);
for (const [a, b] of dupTitles) {
  console.log(`  "${a.title}" — ${a.listed_as} (${a.source_pg_listing_id}) + ${b.listed_as} (${b.source_pg_listing_id})`);
}

// Co-listing: same property slug base, only one in sources due to UNIQUE pg_listing_id
// Check if Dennis fetch lost Tong Boon co-lists because global unique on pg_listing_id
const dennisIds = new Set((sources ?? []).filter((s) => s.agent_slug === "dennis-lim").map((s) => s.pg_listing_id));
const tongIds = new Set((sources ?? []).filter((s) => s.agent_slug === "yeo-tong-boon").map((s) => s.pg_listing_id));
const idOverlap = [...dennisIds].filter((id) => tongIds.has(id));
console.log(`\nShared pg_listing_id between agents: ${idOverlap.length} (impossible with UNIQUE constraint)`);

// Rent/sell totals
const rentSources = (sources ?? []).filter((s) => listedAsFromUrl(s.pg_url) === "rent").length;
const sellSources = (sources ?? []).filter((s) => listedAsFromUrl(s.pg_url) === "sell").length;
console.log(`\nSources by type: ${sellSources} sale, ${rentSources} rent`);
console.log(`Listings by type: ${(listings ?? []).filter((l) => l.listed_as === "sell").length} sell, ${(listings ?? []).filter((l) => l.listed_as === "rent").length} rent`);

console.log("\n=== VERDICT ===");
if (crossAgentSources.length === 0) {
  console.log("No duplicate property keys across agents in sources.");
  console.log("DB UNIQUE on pg_listing_id means each PG listing exists once — co-listed properties only keep whichever agent was saved first on fetch.");
} else {
  console.log(`${crossAgentSources.length} properties appear under both agents with DIFFERENT pg_listing_ids.`);
  console.log(`Unique property count may be ${uniquePropertyKeys.size} vs ${sources?.length} source rows.`);
}
