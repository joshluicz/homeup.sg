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

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const missingIds = [
  "500157310", "500154213", "500150312", "500086210",
  "500051104", "500044866", "500069708", "500047356",
];

const { data: sources } = await supabase
  .from("pg_listing_sources")
  .select("*")
  .in("pg_listing_id", missingIds);

const { data: active } = await supabase
  .from("listings")
  .select("id, title, slug, source_pg_listing_id, source_pg_url, agent?")
  .is("deleted_at", null);

for (const s of sources ?? []) {
  const slugHint = s.pg_url.match(/listing\/(?:for-(?:sale|rent)-)?([a-z0-9-]+)-\d+/)?.[1]
    ?? s.pg_url.match(/listing\/([a-z0-9-]+)-\d+/)?.[1];
  const matches = (active ?? []).filter((l) => {
    if (slugHint && l.slug.includes(slugHint.replace(/-/g, "").slice(0, 8))) return true;
    if (slugHint && l.slug.replace(/-/g, "").includes(slugHint.replace(/-/g, "").slice(0, 10))) return true;
    const urlSlug = slugHint?.replace(/-/g, " ");
    return urlSlug && l.title.toLowerCase().includes(urlSlug.split("-")[0]);
  });

  const titleMatch = (active ?? []).filter((l) => {
    const name = s.pg_url.match(/listing\/(?:for-(?:sale|rent)-)?(.+)-\d+$/)?.[1]
      ?.replace(/-/g, " ");
    if (!name) return false;
    const core = name.replace(/^(for sale |for rent |hdb for sale )/i, "");
    return l.title.toLowerCase().includes(core.slice(0, 12).toLowerCase())
      || core.toLowerCase().includes(l.title.toLowerCase().slice(0, 12));
  });

  console.log(`\n${s.pg_listing_id} (${s.agent_slug})`);
  console.log(`  ${s.pg_url}`);
  const combined = [...new Map([...matches, ...titleMatch].map((l) => [l.id, l])).values()];
  if (combined.length === 0) {
    console.log("  NO active match found");
  } else {
    for (const l of combined) {
      console.log(`  -> active: "${l.title}" slug=${l.slug} pg_id=${l.source_pg_listing_id}`);
    }
  }
}
