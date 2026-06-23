/**
 * Split playbook rows that have BOTH article body + video_url into separate entries.
 * Works without the content_kind column — separation is enforced by empty fields.
 * Run: node scripts/split-playbook-hybrids.mjs
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

function uniqueClipSlug(baseSlug, existingSlugs) {
  let slug = `${baseSlug}-clip`;
  let n = 0;
  while (existingSlugs.has(slug)) {
    n += 1;
    slug = `${baseSlug}-clip-${n}`;
  }
  existingSlugs.add(slug);
  return slug;
}

async function main() {
  const { data: rows, error } = await supabase.from("playbook_videos").select("*");
  if (error) {
    console.error("Failed to load playbook_videos:", error.message);
    process.exit(1);
  }

  const existingSlugs = new Set((rows ?? []).map((r) => r.slug));
  const hybrids = (rows ?? []).filter(
    (r) => String(r.article ?? "").trim() && String(r.video_url ?? "").trim(),
  );

  if (hybrids.length === 0) {
    console.log("No hybrid rows to split.");
  } else {
    console.log(`Splitting ${hybrids.length} hybrid row(s)...`);
  }

  for (const row of hybrids) {
    const clipSlug = uniqueClipSlug(row.slug, existingSlugs);
    const videoTitle = String(row.description ?? "").trim() || row.title;

    const { error: insertError } = await supabase.from("playbook_videos").insert({
      slug: clipSlug,
      title: videoTitle.slice(0, 200),
      description: "",
      category: row.category,
      duration: row.duration ?? "",
      thumbnail: row.thumbnail ?? "",
      video_url: row.video_url,
      featured: row.featured ?? false,
      published_at: row.published_at,
      tags: row.tags ?? [],
      article: "",
      faq: [],
      meta_description: "",
      topic: row.topic ?? null,
    });

    if (insertError) {
      console.error(`  ✗ ${row.slug}: insert failed —`, insertError.message);
      continue;
    }

    const { error: updateError } = await supabase
      .from("playbook_videos")
      .update({
        video_url: "",
        duration: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`  ✗ ${row.slug}: article update failed —`, updateError.message);
      continue;
    }

    console.log(`  ✓ ${row.slug} → article only; video → ${clipSlug}`);
  }

  const { data: refreshed } = await supabase.from("playbook_videos").select("id, slug, article, video_url");
  const videoCount = (refreshed ?? []).filter(
    (r) => String(r.video_url ?? "").trim() && !String(r.article ?? "").trim(),
  ).length;
  const articleCount = (refreshed ?? []).filter((r) => String(r.article ?? "").trim()).length;
  console.log(`Done. ${articleCount} article(s), ${videoCount} video(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
