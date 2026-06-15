/**
 * PG sync / fetch duplicate diagnostic.
 * Run: node scripts/pg-sync-diagnostic.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const k = keyFn(row);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: sources, error: srcErr } = await supabase
  .from("pg_listing_sources")
  .select("agent_slug, pg_url, pg_listing_id, created_at")
  .order("created_at", { ascending: true });

if (srcErr) throw srcErr;

const { data: listings, error: listErr } = await supabase
  .from("listings")
  .select("id, title, slug, status, listed_as, source_pg_url, source_pg_listing_id, created_at, deleted_at")
  .is("deleted_at", null);

if (listErr) throw listErr;

const { data: profiles } = await supabase
  .from("pg_agent_profiles")
  .select("agent_slug, pg_listed_by_id");

console.log("=== PG FETCH / SYNC DIAGNOSTIC ===\n");

console.log("--- pg_listing_sources ---");
console.log(`Total rows: ${sources.length}`);
const uniqueSourceIds = new Set(sources.map((r) => r.pg_listing_id));
console.log(`Unique pg_listing_id: ${uniqueSourceIds.size}`);
const uniqueSourceUrls = new Set(sources.map((r) => r.pg_url));
console.log(`Unique pg_url: ${uniqueSourceUrls.size}`);

const byAgent = groupBy(sources, (r) => r.agent_slug);
for (const [agent, rows] of [...byAgent.entries()].sort()) {
  console.log(`  ${agent}: ${rows.length} rows`);
}

const dupIdsInSources = [...groupBy(sources, (r) => r.pg_listing_id).entries()].filter(
  ([, rows]) => rows.length > 1,
);
console.log(`Duplicate pg_listing_id in sources: ${dupIdsInSources.length}`);

const dupUrlsInSources = [...groupBy(sources, (r) => r.pg_url).entries()].filter(
  ([, rows]) => rows.length > 1,
);
console.log(`Duplicate pg_url in sources: ${dupUrlsInSources.length}`);

// Cross-agent: same pg_listing_id can't exist twice in table due to UNIQUE — check agent assignment conflicts
const sourceIdToAgent = new Map(sources.map((r) => [r.pg_listing_id, r.agent_slug]));

console.log("\n--- listings (not deleted) ---");
console.log(`Total rows: ${listings.length}`);
const withPg = listings.filter((l) => l.source_pg_listing_id);
const withoutPg = listings.filter((l) => !l.source_pg_listing_id);
console.log(`With source_pg_listing_id: ${withPg.length}`);
console.log(`Without source_pg_listing_id: ${withoutPg.length}`);

const byListedAs = groupBy(listings, (l) => l.listed_as);
for (const [la, rows] of [...byListedAs.entries()].sort()) {
  console.log(`  listed_as=${la}: ${rows.length}`);
}

const byStatus = groupBy(listings, (l) => l.status);
for (const [st, rows] of [...byStatus.entries()].sort()) {
  console.log(`  status=${st}: ${rows.length}`);
}

const uniqueListingPgIds = new Set(withPg.map((l) => l.source_pg_listing_id));
console.log(`Unique source_pg_listing_id in listings: ${uniqueListingPgIds.size}`);

const dupPgIdsInListings = [...groupBy(withPg, (l) => l.source_pg_listing_id).entries()].filter(
  ([, rows]) => rows.length > 1,
);
console.log(`Duplicate source_pg_listing_id in listings: ${dupPgIdsInListings.length}`);
if (dupPgIdsInListings.length > 0) {
  console.log("  Examples:");
  for (const [id, rows] of dupPgIdsInListings.slice(0, 5)) {
    console.log(`    ${id}:`);
    for (const r of rows) {
      console.log(`      - ${r.title} (${r.slug}) status=${r.status}`);
    }
  }
}

// Listings imported but not in current sources
const sourceIdSet = new Set(sources.map((r) => r.pg_listing_id));
const orphanedImports = withPg.filter((l) => !sourceIdSet.has(l.source_pg_listing_id));
console.log(`\nListings with PG id NOT in pg_listing_sources: ${orphanedImports.length}`);

// Sources not yet imported
const importedIdSet = new Set(withPg.map((l) => l.source_pg_listing_id));
const notImported = sources.filter((s) => !importedIdSet.has(s.pg_listing_id));
console.log(`Sources not imported to listings: ${notImported.length}`);

// Same title duplicates (fuzzy)
const byTitle = groupBy(
  listings.map((l) => ({ ...l, t: (l.title || "").trim().toLowerCase() })),
  (l) => l.t,
);
const dupTitles = [...byTitle.entries()].filter(([t, rows]) => t && rows.length > 1);
console.log(`\nDuplicate titles (case-insensitive): ${dupTitles.length}`);
if (dupTitles.length > 0) {
  console.log("  Top examples:");
  for (const [title, rows] of dupTitles.sort((a, b) => b[1].length - a[1].length).slice(0, 8)) {
    console.log(`    "${title}" x${rows.length}`);
    for (const r of rows) {
      console.log(
        `      pg_id=${r.source_pg_listing_id ?? "—"} listed_as=${r.listed_as} status=${r.status}`,
      );
    }
  }
}

// URL path slug vs pg_listing_id mismatch check on sources
let urlIdMismatch = 0;
for (const s of sources) {
  const m = s.pg_url.match(/-(\d{6,})(?:\?|#|$|\/)/);
  const fromUrl = m?.[1];
  if (fromUrl && fromUrl !== s.pg_listing_id) urlIdMismatch++;
}
console.log(`\nSources where URL id != pg_listing_id column: ${urlIdMismatch}`);

// Simulated fetch double-count: if we counted sale+rent separately without dedupe by pg_listing_id
// Heuristic: sources that share same normalized title would need listing data — skip

console.log("\n--- Likely inflation causes ---");
const inflation = listings.length - uniqueSourceIds.size;
console.log(`listings (${listings.length}) minus unique source ids (${uniqueSourceIds.size}) = ${inflation}`);
console.log(`sources rows (${sources.length}) minus unique ids (${uniqueSourceIds.size}) = ${sources.length - uniqueSourceIds.size}`);

if (profiles?.length) {
  console.log("\n--- Enabled agent profiles ---");
  for (const p of profiles) {
    if (p.pg_listed_by_id) console.log(`  ${p.agent_slug}: listedById=${p.pg_listed_by_id}`);
  }
}

console.log("\nDone.");
