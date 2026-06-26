/**
 * Backfill the `slug` column on agent_profile_videos for rows created before
 * it existed, so every video gets a shareable /playbook/watch/[slug] page.
 *
 * Prerequisite: run once in Supabase Dashboard → SQL Editor:
 *   supabase/migrations/20250626000000_agent_profile_videos_slug.sql
 *
 * Then run: node scripts/backfill-agent-video-slugs.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function uniqueSlug(base, taken) {
  let slug = base || "video";
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  taken.add(slug);
  return slug;
}

async function main() {
  const sheetVideos = JSON.parse(
    readFileSync(resolve(ROOT, "lib/data/playbook-sheet-videos.json"), "utf8"),
  );

  const [{ data: playbookRows, error: playbookError }, { data: agentRows, error: agentError }] =
    await Promise.all([
      supabase.from("playbook_videos").select("slug"),
      supabase.from("agent_profile_videos").select("id, title, slug").order("created_at", { ascending: true }),
    ]);

  if (playbookError) throw playbookError;
  if (agentError) throw agentError;

  const taken = new Set();
  for (const v of sheetVideos) if (v.slug) taken.add(v.slug);
  for (const row of playbookRows ?? []) if (row.slug) taken.add(row.slug);

  const needsSlug = (agentRows ?? []).filter((row) => !row.slug?.trim());
  const alreadyHas = (agentRows ?? []).length - needsSlug.length;

  // Existing slugs (from a previous partial run) must also count as taken.
  for (const row of agentRows ?? []) if (row.slug) taken.add(row.slug);

  console.log(`${agentRows?.length ?? 0} agent profile videos found, ${alreadyHas} already slugged, ${needsSlug.length} to backfill.`);

  let updated = 0;
  for (const row of needsSlug) {
    const slug = uniqueSlug(slugify(row.title), taken);
    const { error } = await supabase
      .from("agent_profile_videos")
      .update({ slug })
      .eq("id", row.id);
    if (error) {
      console.error(`Failed to set slug for ${row.id} (${row.title}):`, error.message);
      continue;
    }
    updated++;
  }

  console.log(`Done. Backfilled ${updated} of ${needsSlug.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
