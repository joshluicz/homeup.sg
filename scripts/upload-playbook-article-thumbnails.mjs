/**
 * Upload designed article thumbnails to Supabase storage and persist public URLs.
 * Run: node scripts/upload-playbook-article-thumbnails.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const BUCKET = "listing-images";

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

const THUMBNAILS = [
  {
    slug: "how-much-will-you-net-from-selling-your-hdb-2026-calculator-guide",
    file: "article-hdb-sales-calculator.png",
  },
  {
    slug: "hdb-mop-what-happens-when-your-5-years-are-up",
    file: "article-hdb-mop.png",
  },
  {
    slug: "hdb-to-condo-the-exact-step-by-step-upgrade-process-in-singapore-2026",
    file: "article-hdb-to-condo-2026.png",
  },
  {
    slug: "upgrade-hdb-to-condo-hybrid-method-no-absd",
    file: "article-hybrid-no-absd.png",
  },
  {
    slug: "bridging-loans-in-singapore-when-you-need-one",
    file: "article-bridging-loans.png",
  },
  {
    slug: "the-importance-of-making-lasting-power-of-attorney",
    file: "article-lasting-power-of-attorney.png",
  },
  {
    slug: "private-condo-vs-hdb-first-home-singapore",
    file: "article-hdb-or-condo-first-home.png",
  },
  {
    slug: "buying-tenanted-property-singapore-checks",
    file: "article-buying-tenanted-property.png",
  },
  {
    slug: "income-requirements-loans-first-condo-singapore",
    file: "article-3-loan-rules-condo.png",
  },
  {
    slug: "overlooked-factors-buying-condo-singapore",
    file: "article-5-downpayment-easy-part.png",
  },
  {
    slug: "private-condo-vs-ec-when-to-choose-condo",
    file: "article-ec-or-condo-2026.png",
  },
];

async function uploadThumbnail({ slug, file }) {
  const localPath = resolve(ROOT, "public/images/playbook/articles", file);
  const storagePath = `playbook/thumbnails/${file}`;
  const body = readFileSync(localPath);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "31536000",
  });

  if (uploadError) throw new Error(`${file}: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("playbook_videos")
    .update({ thumbnail: publicUrl, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (updateError) throw new Error(`${slug}: ${updateError.message}`);

  console.log(`✅ ${slug}\n   ${publicUrl}`);
  return { slug, publicUrl, file };
}

async function main() {
  const results = [];
  for (const item of THUMBNAILS) {
    results.push(await uploadThumbnail(item));
  }

  const existing = JSON.parse(readFileSync(outPath, "utf8"));
  const slugMap = {
    ...existing,
    ...Object.fromEntries(results.map((r) => [r.slug, r.publicUrl])),
  };
  const outPath = resolve(ROOT, "lib/data/playbook-article-thumbnail-urls.json");
  writeFileSync(outPath, `${JSON.stringify(slugMap, null, 2)}\n`);
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
