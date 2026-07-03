/**
 * Full local automation: Google Sheet → archive → import → auto-publish.
 *
 * Run on your laptop (home IP can reach PropertyGuru; Vercel cannot).
 *
 *   npm run pg:automation           # sheet refresh + sync
 *   npm run pg:automation -- --dry-run
 *   npm run pg:watch                # repeat every 6h (PG_SYNC_INTERVAL_HOURS)
 */
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import { fetchListingPage } from "../lib/listings/import/fetch-listing-page";
import { getPgSyncPreview } from "../lib/listings/pg-sync-preview";
import { purgeExpiredArchivedListings } from "../lib/listings/purge-archived-listings";
import { loadProjectEnv } from "../lib/scripts/load-env";
import { refreshPgSourcesFromGoogleSheet } from "../lib/listings/sync-sheet-sources";
import { publishAllDraftListingsServer } from "../lib/listings/publish-listings-server";
import {
  archiveRemovedPgListings,
  importOnePgListing,
} from "../lib/listings/sync-pg-sources";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const dryRun = process.argv.includes("--dry-run");

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

export async function runPgAutomation(): Promise<number> {
  const env = loadProjectEnv(root);
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  log("Step 1/5 — Refresh listings from Google Sheet…");
  if (dryRun) {
    log("  (dry-run: skipping sheet refresh)");
  } else {
    const sheet = await refreshPgSourcesFromGoogleSheet(supabase);
    log(`  ${sheet.saved} listed source(s) loaded`);
    if (sheet.price_updates.length > 0) {
      log(`  updated ${sheet.price_updates.length} listing price(s) from sheet`);
    }
    if (sheet.linked_manual.length > 0) {
      log(`  linked ${sheet.linked_manual.length} manual listing(s) to PG IDs`);
    }
    if (sheet.skipped.held_off_website > 0) {
      log(`  ${sheet.skipped.held_off_website} held off website (relist later)`);
    }
    const { purged } = await purgeExpiredArchivedListings(supabase);
    if (purged > 0) log(`  purged ${purged} archive(s) older than 7 days`);
  }

  const preview = await getPgSyncPreview(supabase);
  log("Step 2/5 — Preview");
  log(`  sheet sources: ${preview.source_count}`);
  log(`  live on site: ${preview.on_site_active}`);
  log(`  PG ID in DB: ${preview.unchanged}`);
  log(`  to import: ${preview.to_import.length}`);
  log(`  to archive: ${preview.to_archive.length}`);

  if (dryRun) {
    log("Dry run complete — no archive/import changes made.");
    return 0;
  }

  log("Step 3/5 — Archive listings removed from sheet…");
  const archived = await archiveRemovedPgListings(supabase);
  log(`  archived: ${archived.length}`);
  if (archived.length > 0) {
    for (const a of archived.slice(0, 10)) {
      log(`    - ${a.title}`);
    }
    if (archived.length > 10) log(`    … and ${archived.length - 10} more`);
  }

  log("Step 4/5 — Import new listings (auto-publish)…");
  const added: string[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (let i = 0; i < preview.to_import.length; i++) {
    const item = preview.to_import[i];
    log(`  [${i + 1}/${preview.to_import.length}] ${item.pg_url}`);

    let html: string | undefined;
    const fetched = await fetchListingPage(item.pg_url);
    if (fetched.ok) {
      html = fetched.html;
    } else {
      log(`    PG fetch: ${fetched.error} — trying server fetch anyway`);
    }

    const outcome = await importOnePgListing(supabase, item.pg_url, item.pg_listing_id, {
      html,
      publish: true,
    });

    if (outcome.ok) {
      added.push(`${outcome.title} (${outcome.slug})`);
      log(`    OK → published: ${outcome.title}`);
    } else if (outcome.error === "Already imported") {
      log("    skipped (already imported)");
    } else {
      failed.push({ url: item.pg_url, error: outcome.error });
      log(`    FAILED: ${outcome.error}`);
    }
  }

  log("Step 5/5 — Publish any remaining drafts…");
  const published = await publishAllDraftListingsServer(supabase);
  if (published > 0) {
    log(`  published ${published} leftover draft(s)`);
  }

  log("Done.");
  log(`  imported & published: ${added.length}`);
  log(`  failed: ${failed.length}`);
  log(`  archived: ${archived.length}`);

  return failed.length > 0 ? 1 : 0;
}

async function main() {
  const code = await runPgAutomation();
  process.exit(code);
}

const isMain = process.argv[1]?.replace(/\\/g, "/").includes("run-pg-automation");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
