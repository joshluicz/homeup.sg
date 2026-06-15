import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getPgSyncPreview } from "@/lib/listings/pg-sync-preview";

export async function GET() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const preview = await getPgSyncPreview(supabase);
    return NextResponse.json({ success: true, preview });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
