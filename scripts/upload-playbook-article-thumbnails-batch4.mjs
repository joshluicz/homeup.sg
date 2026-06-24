/**
 * Upload 4 designed article thumbnails (batch 4) and update Supabase + URL map.
 * Run: node scripts/upload-playbook-article-thumbnails-batch4.mjs
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const BUCKET = "listing-images";
const JSON_PATH = resolve(ROOT, "lib/data/playbook-article-thumbnail-urls.json");
const PUBLIC_DIR = resolve(ROOT, "public/images/playbook/articles");

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

const ARTICLES = [
  {
    slug: "tips-resale-condo-buyers-singapore",
    file: "article-resale-condo-tips-savvy-buyers.png",
    source: "Resale_Condo_Tips_for_Savvy_Buyers_-a292a22e-836c-421e-959e-5a52a3d46e7b.png",
  },
  {
    slug: "single-pr-first-property-singapore-questions",
    file: "article-single-pr-what-can-you-buy.png",
    source: "What_can_you_buy_sinle_pr-ba3f8f0a-0394-4bc6-ae35-52a82a9b5531.png",
  },
  {
    slug: "buy-property-near-school-p1-registration",
    file: "article-buy-near-primary-school.png",
    source: "Buy_near_good_primary_school._heres_how_it_works-c5cb98ac-58ad-47b7-bf76-dad8001f1fea.png",
  },
  {
    slug: "tips-buying-older-resale-condo-singapore",
    file: "article-old-resale-condo-checklist.png",
    source: "Buying_an_old_resale_condo_4_checklist-609ddcec-40bb-4125-b03e-9db135bab043.png",
  },
];

const ASSETS_DIR =
  "/Users/daylenchang/.cursor/projects/Users-daylenchang-Desktop-WORK-homeup-sg/assets";

function resolveAsset(source) {
  const path = resolve(ASSETS_DIR, source);
  if (!existsSync(path)) throw new Error(`Missing asset: ${path}`);
  return path;
}

async function uploadThumbnail(article) {
  const assetPath = resolveAsset(article.source);
  const publicPath = resolve(PUBLIC_DIR, article.file);
  copyFileSync(assetPath, publicPath);

  const storagePath = `playbook/thumbnails/${article.file}`;
  const body = readFileSync(publicPath);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "31536000",
  });

  if (uploadError) throw new Error(`${article.file}: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("playbook_videos")
    .update({ thumbnail: publicUrl, updated_at: new Date().toISOString() })
    .eq("slug", article.slug);

  if (updateError) throw new Error(`${article.slug}: ${updateError.message}`);

  console.log(`✅ ${article.slug}\n   ${publicUrl}`);
  return { slug: article.slug, publicUrl };
}

async function main() {
  const uploaded = [];
  for (const article of ARTICLES) {
    uploaded.push(await uploadThumbnail(article));
  }

  const existing = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const merged = { ...existing, ...Object.fromEntries(uploaded.map((r) => [r.slug, r.publicUrl])) };
  writeFileSync(JSON_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`\nUpdated ${JSON_PATH} (${uploaded.length} thumbnails)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
