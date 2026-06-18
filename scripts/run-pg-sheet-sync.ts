/**
 * Refresh pg_listing_sources from the Google Sheet (CLI).
 * Run: npm run pg:sheet
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { refreshPgSourcesFromGoogleSheet } from "../lib/listings/sync-sheet-sources";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
  const env: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const result = await refreshPgSourcesFromGoogleSheet(supabase);
  console.log("Saved:", result.saved);
  console.log("By agent:", result.by_agent);
  console.log("Skipped:", result.skipped);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
