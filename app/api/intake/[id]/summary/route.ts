import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { IntakeSummary, ListingType } from "@/lib/intake/types";

export const runtime = "nodejs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveListingType(row: {
  listing_type: string | null;
  property_type: string | null;
  room_or_unit: string | null;
}): ListingType {
  if (row.listing_type) return row.listing_type as ListingType;
  if (row.property_type === "hdb_room") return "hdb_room";
  if (row.property_type === "hdb_whole") return "hdb_whole";
  if (row.property_type === "condo_room") return "condo_room";
  if (row.property_type === "condo_whole") return "condo_whole";
  return "other";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid intake id" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("rental_intakes")
      .select(
        "id, listing_type, property_type, room_or_unit, district, rent_monthly, photo_urls, created_at",
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    const summary: IntakeSummary = {
      id: data.id,
      listing_type: resolveListingType(data),
      district: data.district ?? "",
      rent_monthly: Number(data.rent_monthly),
      photo_count: Array.isArray(data.photo_urls) ? data.photo_urls.length : 0,
      submitted_at: data.created_at,
    };

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
