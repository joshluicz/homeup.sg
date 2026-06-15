import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { archiveRemovedPgListings } from "@/lib/listings/sync-pg-sources";

export async function POST() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const archived = await archiveRemovedPgListings(supabase);
    return NextResponse.json({ success: true, archived });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Archive failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
