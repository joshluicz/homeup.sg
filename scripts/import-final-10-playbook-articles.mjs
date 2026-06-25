/**
 * Import the 10 updated blog articles from lib/data/playbook-final-10-articles.json
 * into Supabase (content + thumbnails + metadata).
 *
 * Generate JSON first:
 *   python3 scripts/build-playbook-final-10-articles.py
 *
 * Run: node scripts/import-final-10-playbook-articles.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const JSON_PATH = resolve(ROOT, "lib/data/playbook-final-10-articles.json");

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

const thumbnailUrls = JSON.parse(
  readFileSync(resolve(ROOT, "lib/data/playbook-article-thumbnail-urls.json"), "utf8"),
);

function resolveThumbnail(slug, localPath) {
  return thumbnailUrls[slug] || localPath;
}

async function upsertArticle(entry) {
  const thumbnail = resolveThumbnail(entry.slug, entry.thumbnail);
  const payload = {
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    meta_description: entry.meta_description,
    category: entry.category,
    topic: entry.topic,
    duration: "",
    thumbnail,
    video_url: "",
    featured: entry.featured,
    published_at: new Date().toISOString().slice(0, 10),
    tags: entry.tags,
    article: entry.article,
    faq: entry.faq,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findError } = await supabase
    .from("playbook_videos")
    .select("id, slug")
    .eq("slug", entry.slug)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase.from("playbook_videos").update(payload).eq("id", existing.id);
    if (error) throw error;
    console.log(`✅ Updated: ${entry.slug}`);
    return "updated";
  }

  const { error } = await supabase.from("playbook_videos").insert(payload);
  if (error) throw error;
  console.log(`✅ Created: ${entry.slug}`);
  return "created";
}

async function main() {
  const articles = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  let updated = 0;
  let created = 0;

  for (const entry of articles) {
    const result = await upsertArticle(entry);
    if (result === "updated") updated++;
    else created++;
  }

  console.log(`\nDone. Updated ${updated} | Created ${created} | Total ${articles.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
