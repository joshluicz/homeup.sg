/**
 * Purges all listings from Supabase and optional storage files.
 * Usage: node scripts/purge-listings.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function purgeStorage() {
  const { data: topLevel, error: listError } = await supabase.storage
    .from("listing-images")
    .list("listings", { limit: 1000 });

  if (listError) {
    console.warn("Storage list warning:", listError.message);
    return;
  }

  if (!topLevel?.length) {
    console.log("No listing storage folders to remove.");
    return;
  }

  const pathsToRemove = [];
  for (const folder of topLevel) {
    const prefix = `listings/${folder.name}`;
    const { data: files } = await supabase.storage.from("listing-images").list(prefix, {
      limit: 1000,
    });
    for (const file of files ?? []) {
      pathsToRemove.push(`${prefix}/${file.name}`);
    }
  }

  if (pathsToRemove.length === 0) return;

  const { error: removeError } = await supabase.storage
    .from("listing-images")
    .remove(pathsToRemove);

  if (removeError) {
    console.warn("Storage remove warning:", removeError.message);
  } else {
    console.log(`Removed ${pathsToRemove.length} storage file(s).`);
  }
}

async function main() {
  const { count, error: countError } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Count failed:", countError.message);
    process.exit(1);
  }

  console.log(`Found ${count ?? 0} listing row(s).`);

  const { error: deleteError } = await supabase.from("listings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
    process.exit(1);
  }

  console.log("All listings deleted from database.");
  await purgeStorage();
  console.log("Done.");
}

main();
