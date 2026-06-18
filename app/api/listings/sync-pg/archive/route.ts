import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { archiveRemovedPgListings } from "@/lib/listings/sync-pg-sources";
import { purgeExpiredArchivedListings } from "@/lib/listings/purge-archived-listings";

export async function POST() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const archived = await archiveRemovedPgListings(supabase);
    const { purged } = await purgeExpiredArchivedListings(supabase);
    return NextResponse.json({ success: true, archived, purged });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Archive failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
