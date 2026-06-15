import { createClient } from "@/lib/supabase/client";
import type { FlatType, Listing } from "@/lib/listings/types";

export type ListingStats = {
  total: number;
  hdb: number;
  condo: number;
  landed: number;
  apartment: number;
};

function mapListing(row: Record<string, unknown>): Listing {
  return {
    ...row,
    price: Number(row.price),
    area_sqft: Number(row.area_sqft),
    image_urls: (row.image_urls as string[]) ?? [],
  } as Listing;
}

export async function getActiveListings(): Promise<Listing[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapListing);
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapListing(data) : null;
}

export async function getRelatedListings(
  flatType: FlatType,
  excludeSlug: string,
  limit = 4,
): Promise<Listing[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("flat_type", flatType)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapListing);
}

export async function getListingStats(): Promise<ListingStats> {
  const listings = await getActiveListings();
  return {
    total: listings.length,
    hdb: listings.filter((l) => l.flat_type === "hdb").length,
    condo: listings.filter((l) => l.flat_type === "condominium" || l.flat_type === "apartment").length,
    landed: listings.filter((l) => l.flat_type === "landed").length,
    apartment: listings.filter((l) => l.flat_type === "apartment").length,
  };
}

export async function getAllListingSlugs(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("slug")
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.slug as string);
}
