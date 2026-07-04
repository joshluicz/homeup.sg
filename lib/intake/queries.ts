import { createServiceClient } from "@/lib/supabase/service";
import type { IntakeSummary, ListingType } from "./types";

function resolveListingType(row: {
  listing_type: string | null;
  property_type: string | null;
  room_or_unit: string | null;
}): ListingType {
  if (row.listing_type) return row.listing_type as ListingType;

  if (row.property_type === "hdb_room" || (row.property_type?.startsWith("hdb") && row.room_or_unit === "room")) {
    return "hdb_room";
  }
  if (row.property_type === "hdb_whole" || (row.property_type?.startsWith("hdb") && row.room_or_unit === "unit")) {
    return "hdb_whole";
  }
  if (row.property_type === "condo_room" || (row.property_type?.startsWith("condo") && row.room_or_unit === "room")) {
    return "condo_room";
  }
  if (row.property_type === "condo_whole" || (row.property_type?.startsWith("condo") && row.room_or_unit === "unit")) {
    return "condo_whole";
  }
  return (row.property_type as ListingType) ?? "other";
}

export async function getIntakeSummary(id: string): Promise<IntakeSummary | null> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("rental_intakes")
      .select(
        "id, listing_type, property_type, room_or_unit, district, rent_monthly, photo_urls, created_at",
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      listing_type: resolveListingType(data),
      district: data.district ?? "",
      rent_monthly: Number(data.rent_monthly),
      photo_count: Array.isArray(data.photo_urls) ? data.photo_urls.length : 0,
      submitted_at: data.created_at,
    };
  } catch {
    return null;
  }
}
