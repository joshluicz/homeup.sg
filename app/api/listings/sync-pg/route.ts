import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { runPgListingSync } from "@/lib/listings/sync-pg-sources";

export const maxDuration = 300;

export async function POST() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const result = await runPgListingSync(supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
