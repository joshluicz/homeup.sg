/**
 * Create agent_profile_videos table (if needed) and sync existing TikTok clips
 * from lib/data/agent-profile-videos-seed.json into Supabase.
 *
 * Prerequisite: run the migration SQL once in Supabase Dashboard → SQL Editor:
 *   supabase/migrations/20250624000000_agent_profile_videos.sql
 *
 * Then run: node scripts/seed-agent-profile-videos.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const SEED_PATH = resolve(ROOT, "lib/data/agent-profile-videos-seed.json");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function tableExists() {
  const { error } = await supabase.from("agent_profile_videos").select("id").limit(1);
  if (!error) return true;
  if (error.message.includes("agent_profile_videos") && error.message.includes("schema cache")) {
    return false;
  }
  throw error;
}

async function upsertVideo(entry) {
  const { data: existing, error: findError } = await supabase
    .from("agent_profile_videos")
    .select("id")
    .eq("agent_slug", entry.agent_slug)
    .eq("video_url", entry.video_url)
    .maybeSingle();

  if (findError) throw findError;

  const payload = {
    agent_slug: entry.agent_slug,
    title: entry.title,
    video_url: entry.video_url,
    featured_in_display_a: true,
    sort_order: entry.sort_order,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("agent_profile_videos")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return "updated";
  }

  const { error } = await supabase.from("agent_profile_videos").insert(payload);
  if (error) throw error;
  return "created";
}

async function main() {
  const exists = await tableExists();
  if (!exists) {
    console.error(`
❌ Table public.agent_profile_videos does not exist yet.

Run this SQL in Supabase Dashboard → SQL Editor (one time):
  supabase/migrations/20250624000000_agent_profile_videos.sql

Then re-run: node scripts/seed-agent-profile-videos.mjs
`);
    process.exit(1);
  }

  const agents = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  let created = 0;
  let updated = 0;

  for (const agent of agents) {
    for (const video of agent.videos) {
      const result = await upsertVideo({
        agent_slug: agent.agent_slug,
        title: video.title,
        video_url: video.video_url,
        sort_order: video.sort_order,
      });
      if (result === "created") created++;
      else updated++;
    }
    console.log(`✅ ${agent.agent_name}: ${agent.videos.length} video(s) synced`);
  }

  console.log(`\nDone. Created ${created} | Updated ${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
