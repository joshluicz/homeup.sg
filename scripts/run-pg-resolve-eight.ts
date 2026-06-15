/**
 * Resolve 8 orphan PG sources: import real gaps, remove duplicate PG ids.
 * Run: npx tsx scripts/run-pg-resolve-eight.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { propertySlugFromPgUrl, listedAsFromPgUrl } from "../lib/listings/pg-url";
import { importOnePgListing } from "../lib/listings/sync-pg-sources";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
  const env: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      env[key] = value;
      if (!process.env[key]) process.env[key] = value;
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: sources } = await supabase.from("pg_listing_sources").select("*");
  const { data: active } = await supabase
    .from("listings")
    .select("slug, listed_as, source_pg_listing_id")
    .is("deleted_at", null)
    .not("source_pg_listing_id", "is", null);

  const activeIds = new Set((active ?? []).map((l) => l.source_pg_listing_id));
  const missing = (sources ?? []).filter((s) => !activeIds.has(s.pg_listing_id));

  console.log(`[resolve] ${missing.length} source(s) without active listing\n`);

  const toImport: typeof missing = [];
  const toDelete: typeof missing = [];

  for (const s of missing) {
    const propSlug = propertySlugFromPgUrl(s.pg_url);
    const listedAs = listedAsFromPgUrl(s.pg_url);
    const covered = (active ?? []).some((l) => {
      const base = l.slug.replace(/-(rent|sell)$/, "");
      return base === propSlug && l.listed_as === listedAs;
    });

    if (covered) {
      toDelete.push(s);
      console.log(`DUPLICATE source ${s.pg_listing_id} (${propSlug} ${listedAs}) → delete`);
    } else {
      toImport.push(s);
      console.log(`IMPORT ${s.pg_listing_id} (${propSlug} ${listedAs})`);
    }
  }

  for (const s of toImport) {
    console.log(`\n[resolve] Importing ${s.pg_url}`);
    const outcome = await importOnePgListing(supabase, s.pg_url, s.pg_listing_id);
    if (outcome.ok) {
      console.log(`  OK: ${outcome.title} (${outcome.slug})`);
    } else {
      console.log(`  FAILED: ${outcome.error}`);
    }
  }

  if (toDelete.length > 0) {
    const ids = toDelete.map((s) => s.pg_listing_id);
    const { error } = await supabase.from("pg_listing_sources").delete().in("pg_listing_id", ids);
    if (error) throw new Error(error.message);
    console.log(`\n[resolve] Deleted ${toDelete.length} duplicate source row(s)`);
  }

  console.log("\n[resolve] Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
