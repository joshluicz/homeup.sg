import { createClient } from "@supabase/supabase-js";
import type { ListingStats } from "@/lib/listings/queries";
import type { FlatType, Listing } from "@/lib/listings/types";

function mapListingRow(row: Record<string, unknown>): Listing {
  return {
    ...row,
    price: Number(row.price),
    area_sqft: Number(row.area_sqft),
    image_urls: (row.image_urls as string[]) ?? [],
  } as Listing;
}

/** Server/build-time Supabase queries (no cookies). Used by sitemap and generateStaticParams. */
export async function getAllListingSlugsServer(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("slug")
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    console.warn("getAllListingSlugsServer:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.slug as string);
}

export async function getListingBySlugServer(slug: string): Promise<Listing | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapListingRow(data);
}

export async function getListingStatsServer(): Promise<ListingStats> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { total: 0, hdb: 0, condo: 0, landed: 0, apartment: 0 };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("flat_type")
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    console.warn("getListingStatsServer:", error.message);
    return { total: 0, hdb: 0, condo: 0, landed: 0, apartment: 0 };
  }

  const listings = data ?? [];
  return {
    total: listings.length,
    hdb: listings.filter((l) => l.flat_type === "hdb").length,
    condo: listings.filter(
      (l) => l.flat_type === "condominium" || l.flat_type === "apartment",
    ).length,
    landed: listings.filter((l) => l.flat_type === "landed").length,
    apartment: listings.filter((l) => l.flat_type === "apartment").length,
  };
}

export async function getRelatedListingsServer(
  flatType: FlatType,
  excludeSlug: string,
  limit = 4,
): Promise<Listing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("flat_type", flatType)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("getRelatedListingsServer:", error.message);
    return [];
  }

  return (data ?? []).map(mapListingRow);
}

export async function getActiveListingsServer(limit?: number): Promise<Listing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (limit != null) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.warn("getActiveListingsServer:", error.message);
    return [];
  }

  return (data ?? []).map(mapListingRow);
}
