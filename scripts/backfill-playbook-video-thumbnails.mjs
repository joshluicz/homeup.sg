/**
 * Backfill empty playbook_videos.thumbnail from the content sheet catalogue.
 * Run: node scripts/backfill-playbook-video-thumbnails.mjs
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const sheetRows = JSON.parse(
  readFileSync(resolve(ROOT, "lib/data/playbook-sheet-videos.json"), "utf8"),
);

function urlKey(url) {
  return (url || "").trim().toLowerCase();
}

const thumbByUrl = new Map(
  sheetRows
    .filter((row) => row.url && row.thumbnail?.trim())
    .map((row) => [urlKey(row.url), row.thumbnail.trim()]),
);

async function main() {
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("id,slug,title,video_url,thumbnail")
    .not("video_url", "is", null)
    .neq("video_url", "");

  if (error) throw error;

  let updated = 0;
  let skipped = 0;

  for (const row of data) {
    if (row.thumbnail?.trim()) {
      skipped++;
      continue;
    }

    const thumb = thumbByUrl.get(urlKey(row.video_url));
    if (!thumb) continue;

    const { error: updateError } = await supabase
      .from("playbook_videos")
      .update({ thumbnail: thumb, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (updateError) {
      console.error(`✗ ${row.slug}: ${updateError.message}`);
      continue;
    }

    updated++;
    console.log(`✓ ${row.slug}`);
  }

  console.log(`\nDone. Updated: ${updated} | Skipped (already had thumb): ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
