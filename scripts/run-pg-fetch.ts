import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchPgListingsWithPatchright } from "../lib/listings/fetch-agent-pg-patchright";

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

  console.log("[pg-fetch] Starting patchright fetch — Chrome will open. Solve captcha if shown.\n");

  const result = await fetchPgListingsWithPatchright(supabase);

  console.log("\n[pg-fetch] Done.\n");
  console.log(`totalNew: ${result.totalNew}`);
  for (const row of result.perAgentMode) {
    if (row.error === "No listedById saved") continue;
    const err = row.error ? ` ERROR: ${row.error}` : "";
    console.log(
      `  ${row.agent_name} ${row.mode}: found=${row.found} new=${row.new}${err}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
