import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchListingsFromGoogleSheet,
  type FetchSheetListingsResult,
  type SheetListingRow,
} from "@/lib/listings/google-sheet-listings";

export type SyncSheetSourcesResult = FetchSheetListingsResult & {
  saved: number;
  by_agent: Record<string, number>;
};

export async function replacePgSourcesFromSheet(
  supabase: SupabaseClient,
  active: SheetListingRow[],
): Promise<{ saved: number; by_agent: Record<string, number> }> {
  const { error: deleteError } = await supabase
    .from("pg_listing_sources")
    .delete()
    .not("id", "is", null);

  if (deleteError) throw new Error(deleteError.message);

  if (active.length === 0) {
    return { saved: 0, by_agent: {} };
  }

  const { error: insertError } = await supabase.from("pg_listing_sources").insert(
    active.map((row) => ({
      agent_slug: row.agent_slug,
      pg_url: row.pg_url,
      pg_listing_id: row.pg_listing_id,
    })),
  );

  if (insertError) throw new Error(insertError.message);

  const by_agent: Record<string, number> = {};
  for (const row of active) {
    by_agent[row.agent_name] = (by_agent[row.agent_name] ?? 0) + 1;
  }

  return { saved: active.length, by_agent };
}

export async function refreshPgSourcesFromGoogleSheet(
  supabase: SupabaseClient,
): Promise<SyncSheetSourcesResult> {
  const sheet = await fetchListingsFromGoogleSheet();
  const { saved, by_agent } = await replacePgSourcesFromSheet(supabase, sheet.active);
  return { ...sheet, saved, by_agent };
}
