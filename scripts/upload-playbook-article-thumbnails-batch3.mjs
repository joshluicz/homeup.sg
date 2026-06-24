/**
 * Upload 10 designed article thumbnails (batch 3) and update Supabase + URL map.
 * Run: node scripts/upload-playbook-article-thumbnails-batch3.mjs
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
    slug: "factors-couples-miss-first-resale-condo",
    file: "article-couples-missed-factors-first-resale-condo.png",
    source:
      "4_commonly_missed_factors._Couples_buying_first_resale_condo_-f439273e-0534-4b31-b894-beb9528276c5.png",
  },
  {
    slug: "income-requirements-loans-first-condo-singapore",
    file: "article-3-loan-rules-condo.png",
    source: "3_loan_rules__know_them_before_you_start_viewing_condo-d4616d37-7fd9-4638-af3c-48372f9adb4c.png",
  },
  {
    slug: "new-launch-vs-resale-condo-myths",
    file: "article-resale-condo-assumptions-myths.png",
    source: "3_assumptions_about_resale_condo_that_dont_hold_up-fc084211-8e63-418e-8f6f-52391a903a68.png",
  },
  {
    slug: "investment-strategies-may-backfire-private-property",
    file: "article-condo-strategies-may-backfire.png",
    source: "4_Condo_strategies_that_may_backfire-0ae8b5d3-48d5-4754-918f-51b6b733a745.png",
  },
  {
    slug: "hdb-to-condo-upgrading-mistakes-to-avoid",
    file: "article-hdb-to-condo-timing-mistakes.png",
    source: "Upgrade_HDB_to_Condo_4_timing_mistakes_-2e289d12-7324-47b6-813f-ee9fd81cfb0e.png",
  },
  {
    slug: "buying-private-property-age-45-singapore",
    file: "article-buying-private-property-age-45.png",
    source: "buying_a_pte_property_at_45_years_or_older-5b29769e-af7b-46af-98e0-0d2778689b81.png",
  },
  {
    slug: "buying-first-private-property-before-35",
    file: "article-buying-private-property-before-35.png",
    source: "Buying_a_PTE_property_at_age_35-d26490ca-8ae0-4c02-bb72-83faf96dc409.png",
  },
  {
    slug: "new-launch-condo-showroom-tips-singapore",
    file: "article-new-launch-showroom-tips.png",
    source:
      "Showflat_is_designed_to_impress._Here_s_what_to_look_past-f3f00e2b-79c9-4b43-ad7a-b5ea8f422641.png",
  },
  {
    slug: "how-to-spot-undervalued-condo-singapore",
    file: "article-new-launch-vs-resale-best-deal.png",
    source: "New_launch_may_not_be_the_best_deal_-b5d9c978-a9ef-479c-8379-588d663d7c3a.png",
  },
  {
    slug: "singles-buying-first-condo-singapore-tips",
    file: "article-singles-first-condo-checklist.png",
    source: "Buying_1st_condo_as_a_single_3_checklist-9056b833-e57f-49be-92af-470471559f68.png",
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
