/**
 * Find pg_listing_sources with no active listing row.
 * Run: node scripts/pg-missing-imports.mjs
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

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: sources } = await supabase
  .from("pg_listing_sources")
  .select("agent_slug, pg_url, pg_listing_id");

const { data: active } = await supabase
  .from("listings")
  .select("id, title, slug, source_pg_listing_id, deleted_at, status")
  .is("deleted_at", null);

const { data: archived } = await supabase
  .from("listings")
  .select("id, title, slug, source_pg_listing_id, deleted_at, status")
  .not("deleted_at", "is", null);

const activeIds = new Set((active ?? []).map((r) => r.source_pg_listing_id).filter(Boolean));
const missing = (sources ?? []).filter((s) => !activeIds.has(s.pg_listing_id));

console.log(`Missing active listing for ${missing.length} source(s):\n`);

for (const s of missing) {
  const arch = (archived ?? []).find((l) => l.source_pg_listing_id === s.pg_listing_id);
  const archBySlug = (archived ?? []).find((l) => {
    const slugFromUrl = s.pg_url.match(/listing\/([a-z0-9-]+)-\d+/)?.[1];
    return slugFromUrl && l.slug === slugFromUrl;
  });
  console.log(`pg_listing_id: ${s.pg_listing_id}`);
  console.log(`  agent: ${s.agent_slug}`);
  console.log(`  url: ${s.pg_url}`);
  if (arch) {
    console.log(`  archived row: ${arch.title} (${arch.slug}) id=${arch.id}`);
  } else if (archBySlug) {
    console.log(`  archived by slug match: ${archBySlug.title} pg_id=${archBySlug.source_pg_listing_id}`);
  } else {
    console.log(`  archived row: none`);
  }
  console.log();
}
