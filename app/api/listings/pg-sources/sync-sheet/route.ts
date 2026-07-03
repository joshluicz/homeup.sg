import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { refreshPgSourcesFromGoogleSheet } from "@/lib/listings/sync-sheet-sources";
import { purgeExpiredArchivedListings } from "@/lib/listings/purge-archived-listings";
import { revalidateListingPaths } from "@/lib/listings/revalidate-listings";

export const maxDuration = 60;

export async function POST() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const result = await refreshPgSourcesFromGoogleSheet(supabase);
    const { purged } = await purgeExpiredArchivedListings(supabase);
    if (result.price_updates.length > 0 || purged > 0) {
      revalidateListingPaths(result.price_updates.map((update) => update.slug));
    }
    return NextResponse.json({ success: true, ...result, purged });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sheet sync failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
