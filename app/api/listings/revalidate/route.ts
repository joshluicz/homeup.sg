import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { revalidateListingPaths } from "@/lib/listings/revalidate-listings";

export async function POST() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  revalidateListingPaths();
  return NextResponse.json({ success: true });
}
