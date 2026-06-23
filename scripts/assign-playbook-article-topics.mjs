/**
 * Assign playbook section (topic) to articles missing one, inferred from category.
 * Run: node scripts/assign-playbook-article-topics.mjs
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

function inferTopicFromCategory(category) {
  if (category === "buying") return "buying_first";
  if (category === "market" || category === "tips") return "condo_tips";
  return "upgraders";
}

function isArticle(row) {
  const article = (row.article ?? "").trim();
  const videoUrl = (row.video_url ?? "").trim();
  return Boolean(article) && !videoUrl;
}

const { data: rows, error } = await supabase.from("playbook_videos").select("*");
if (error) {
  console.error("Failed to load playbook rows:", error.message);
  process.exit(1);
}

const toUpdate = (rows ?? []).filter((row) => isArticle(row) && !row.topic);

if (toUpdate.length === 0) {
  console.log("All articles already have a section assigned.");
  process.exit(0);
}

console.log(`Assigning section to ${toUpdate.length} article(s)…`);

for (const row of toUpdate) {
  const topic = inferTopicFromCategory(row.category);
  const { error: updateError } = await supabase
    .from("playbook_videos")
    .update({ topic, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (updateError) {
    console.error(`  ✗ ${row.slug}: ${updateError.message}`);
  } else {
    console.log(`  ✓ ${row.slug} → ${topic} (from category: ${row.category})`);
  }
}

console.log("Done.");
