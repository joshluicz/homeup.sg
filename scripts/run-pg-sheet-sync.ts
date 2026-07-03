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
  console.log("Sell:", result.sell_on_sheet, "Rent:", result.rent_on_sheet);
  console.log("Agent column B filled:", result.sheet_agent_column_count);
  console.log("By agent:", result.by_agent);
  console.log("Skipped:", result.skipped);
  console.log("Price updates:", result.price_updates.length);
  for (const update of result.price_updates.slice(0, 20)) {
    console.log(
      `  ${update.pg_listing_id} (${update.slug}): $${update.old_price.toLocaleString(
        "en-SG",
      )} → $${update.new_price.toLocaleString("en-SG")}`,
    );
  }
  if (result.sheet_format_fixes.length > 0) {
    console.log("\nSheet format fixes (move agent to column B):");
    for (const f of result.sheet_format_fixes) {
      console.log(`  ${f.pg_listing_id} → "${f.misplaced_agent_label}" · ${f.client_name.slice(0, 50)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
