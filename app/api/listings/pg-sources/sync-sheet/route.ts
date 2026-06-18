import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { refreshPgSourcesFromGoogleSheet } from "@/lib/listings/sync-sheet-sources";

export const maxDuration = 60;

export async function POST() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const result = await refreshPgSourcesFromGoogleSheet(supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sheet sync failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
