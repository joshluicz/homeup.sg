import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPgSyncPreview } from "../lib/listings/pg-sync-preview";
import {
  archiveRemovedPgListings,
  importOnePgListing,
} from "../lib/listings/sync-pg-sources";

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

  const preview = await getPgSyncPreview(supabase);
  console.log("[pg-sync] Preview:");
  console.log(`  to_import: ${preview.to_import.length}`);
  console.log(`  to_archive: ${preview.to_archive.length}`);
  console.log(`  unchanged: ${preview.unchanged}`);

  console.log("\n[pg-sync] Archiving removed listings…");
  const archived = await archiveRemovedPgListings(supabase);
  console.log(`  archived: ${archived.length}`);

  const added: Array<{ title: string; slug: string; pg_url: string }> = [];
  const failed: Array<{ pg_url: string; error: string }> = [];
  let skipped = preview.unchanged;

  for (let i = 0; i < preview.to_import.length; i++) {
    const item = preview.to_import[i];
    console.log(`\n[pg-sync] Import ${i + 1}/${preview.to_import.length}: ${item.pg_url}`);

    const outcome = await importOnePgListing(supabase, item.pg_url, item.pg_listing_id);
    if (outcome.ok) {
      added.push({ title: outcome.title, slug: outcome.slug, pg_url: item.pg_url });
      console.log(`  OK: ${outcome.title}`);
    } else if (outcome.error === "Already imported") {
      skipped += 1;
      console.log("  skipped (already imported)");
    } else {
      failed.push({ pg_url: item.pg_url, error: outcome.error });
      console.log(`  FAILED: ${outcome.error}`);
    }
  }

  console.log("\n[pg-sync] Done.");
  console.log(`  added: ${added.length}`);
  console.log(`  skipped: ${skipped}`);
  console.log(`  failed: ${failed.length}`);
  console.log(`  archived: ${archived.length}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
