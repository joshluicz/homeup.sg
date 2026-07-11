import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { importOnePgListing } from "@/lib/listings/sync-pg-sources";
import { revalidateListingPaths } from "@/lib/listings/revalidate-listings";

export const maxDuration = 120;

export async function POST(request: Request) {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  let body: { pg_url?: string; pg_listing_id?: string; html?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pgUrl = body.pg_url?.trim();
  const pgListingId = body.pg_listing_id?.trim();

  if (!pgUrl || !pgListingId) {
    return NextResponse.json(
      { error: "pg_url and pg_listing_id are required" },
      { status: 400 },
    );
  }

  try {
    const outcome = await importOnePgListing(supabase, pgUrl, pgListingId, {
      html: body.html,
    });
    if (!outcome.ok) {
      return NextResponse.json({
        success: false,
        skipped: outcome.error === "Already imported",
        error: outcome.error,
      });
    }
    revalidateListingPaths([outcome.slug]);
    return NextResponse.json({
      success: true,
      title: outcome.title,
      slug: outcome.slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
