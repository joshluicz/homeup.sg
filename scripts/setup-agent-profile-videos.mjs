/**
 * One-time setup: create agent_profile_videos + seed existing agent TikTok clips.
 *
 * Add your Supabase database password to .env.local:
 *   SUPABASE_DB_PASSWORD=your-password-from-dashboard
 *
 * Find it: Supabase Dashboard → Project Settings → Database → Database password
 *
 * Run: node scripts/setup-agent-profile-videos.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pg from "pg";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

function loadEnv() {
  return Object.fromEntries(
    readFileSync(resolve(ROOT, ".env.local"), "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

function projectRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

async function runMigration(client) {
  const sql = readFileSync(
    resolve(ROOT, "supabase/migrations/20250624000000_agent_profile_videos.sql"),
    "utf8",
  );
  await client.query(sql);
}

async function countRows(client) {
  const { rows } = await client.query(
    "SELECT agent_slug, COUNT(*)::int AS count FROM agent_profile_videos GROUP BY agent_slug ORDER BY agent_slug",
  );
  return rows;
}

async function main() {
  const env = loadEnv();
  const ref = projectRef(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const password = env.SUPABASE_DB_PASSWORD?.trim();

  if (!ref) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL is missing or invalid in .env.local");
    process.exit(1);
  }

  if (!password) {
    console.error(`
❌ SUPABASE_DB_PASSWORD is not set in .env.local

Add your Supabase database password, then re-run:
  node scripts/setup-agent-profile-videos.mjs

Where to find it:
  Supabase Dashboard → Project Settings → Database → Database password
  https://supabase.com/dashboard/project/${ref}/settings/database

Or run the SQL manually in SQL Editor:
  https://supabase.com/dashboard/project/${ref}/sql/new
  Paste: supabase/migrations/20250624000000_agent_profile_videos.sql
  Then: node scripts/seed-agent-profile-videos.mjs
`);
    process.exit(1);
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

  console.log("Connecting to Supabase Postgres…");
  await client.connect();

  try {
    console.log("Running migration + seed SQL…");
    await runMigration(client);
    const counts = await countRows(client);
    console.log("\n✅ agent_profile_videos is ready\n");
    for (const row of counts) {
      console.log(`   ${row.agent_slug}: ${row.count} video(s)`);
    }
    const total = counts.reduce((sum, row) => sum + row.count, 0);
    console.log(`\nTotal: ${total} videos synced`);
    console.log("\nRefresh http://localhost:3000/admin/agent-profiles");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  if (/password authentication failed/i.test(err.message)) {
    console.error("Check SUPABASE_DB_PASSWORD in .env.local");
  }
  process.exit(1);
});
