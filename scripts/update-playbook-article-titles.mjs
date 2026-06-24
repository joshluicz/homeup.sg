/**
 * Apply blog title updates from Dennis's Google Sheet (New Blog Titles tab).
 * Run: node scripts/update-playbook-article-titles.mjs
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

/** [slug, newTitle, oldTitleHint] — from sheet gid=1835201424 */
const TITLE_UPDATES = [
  [
    "overlooked-factors-buying-condo-singapore",
    "Why the 5% Down Payment Is the Easy Part of Buying a Condo in Singapore",
    "4 Overlooked Factors When Buying a Condo",
  ],
  [
    "buying-tenanted-property-singapore-checks",
    "Buying a Tenanted Property in Singapore? Read This Before You Sign the OTP",
    "3 Steps to Check When Buying a Tenanted Property",
  ],
  [
    "private-condo-vs-hdb-first-home-singapore",
    "HDB or Condo as Your First Home in Singapore? Here's How to Actually Decide",
    "Should You Buy a Private Condo as Your First Home",
  ],
  [
    "income-requirements-loans-first-condo-singapore",
    "Don't Start Viewing Condos in Singapore Until You Know These 3 Borrowing Rules",
    "Everything About Income Requirements and Loans for Your First Condo",
  ],
  [
    "private-condo-vs-ec-when-to-choose-condo",
    "EC or Condo as Your First Home? Here's How the May 2026 Rule Changes Shift the Answer",
    "4 Situations When First Time Buyers Should Choose Private Condo Over Executive Condo",
  ],
];

async function main() {
  const { data: rows, error: listError } = await supabase
    .from("playbook_videos")
    .select("id, slug, title, article");

  if (listError) throw listError;

  let updated = 0;
  let skipped = 0;

  for (const [slug, newTitle, oldHint] of TITLE_UPDATES) {
    const match =
      rows.find((r) => r.slug === slug) ||
      rows.find((r) => r.title?.toLowerCase().includes(oldHint.slice(0, 24).toLowerCase()));

    if (!match) {
      console.warn(`Not found: ${slug}`);
      skipped++;
      continue;
    }

    if (match.title === newTitle) {
      console.log(`Already up to date: ${match.slug}`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("playbook_videos")
      .update({
        title: newTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.id);

    if (error) {
      console.error(`Failed ${match.slug}:`, error.message);
      skipped++;
    } else {
      console.log(`Updated: ${match.slug}`);
      console.log(`  Old: ${match.title}`);
      console.log(`  New: ${newTitle}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated} | Skipped: ${skipped}`);
}

main();
