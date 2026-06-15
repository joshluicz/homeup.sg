import { createClient } from "@supabase/supabase-js";
import type { Listing, FlatType } from "@/lib/listings/types";
import type { ListingStats } from "@/lib/listings/queries";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function mapListing(row: Record<string, unknown>): Listing {
  return {
    ...row,
    price: Number(row.price),
    area_sqft: Number(row.area_sqft),
    image_urls: (row.image_urls as string[]) ?? [],
  } as Listing;
}

export async function getActiveListingsStatic(): Promise<Listing[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapListing);
}

export async function getListingStatsStatic(listings: Listing[]): Promise<ListingStats> {
  return {
    total: listings.length,
    hdb: listings.filter((l) => l.flat_type === "hdb").length,
    condo: listings.filter((l) => (l.flat_type as FlatType) === "condominium" || (l.flat_type as FlatType) === "apartment").length,
    landed: listings.filter((l) => (l.flat_type as FlatType) === "landed").length,
    apartment: listings.filter((l) => (l.flat_type as FlatType) === "apartment").length,
  };
}
