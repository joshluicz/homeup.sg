import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ListingStats } from "@/lib/listings/queries";
import type { FlatType, Listing } from "@/lib/listings/types";

/** Shared tag for on-demand ISR. Bust with revalidateTag(LISTINGS_CACHE_TAG). */
export const LISTINGS_CACHE_TAG = "listings";

function mapListingRow(row: Record<string, unknown>): Listing {
  return {
    ...row,
    price: Number(row.price),
    area_sqft: Number(row.area_sqft),
    image_urls: (row.image_urls as string[]) ?? [],
  } as Listing;
}

/**
 * Server Supabase client whose fetches carry the listings cache tag.
 * Do not use cache: "no-store" here — that forces dynamic rendering and breaks
 * static generation / ISR. Tag + revalidateTag is how we bust after sync.
 */
function serverSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          // Next.js extends RequestInit with `next` for ISR tags.
          next: { tags: [LISTINGS_CACHE_TAG], revalidate: 300 },
        } as RequestInit),
    },
  });
}

async function fetchAllListingSlugs(): Promise<string[]> {
  const supabase = serverSupabase();
  if (!supabase) return [];

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

async function fetchListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = serverSupabase();
  if (!supabase) return null;

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

async function fetchListingStats(): Promise<ListingStats> {
  const supabase = serverSupabase();
  if (!supabase) {
    return { total: 0, hdb: 0, condo: 0, landed: 0, apartment: 0 };
  }

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

async function fetchRelatedListings(
  flatType: FlatType,
  excludeSlug: string,
  limit: number,
): Promise<Listing[]> {
  const supabase = serverSupabase();
  if (!supabase) return [];

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

async function fetchActiveListings(limit?: number): Promise<Listing[]> {
  const supabase = serverSupabase();
  if (!supabase) return [];

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

/** Server/build-time Supabase queries (no cookies). Used by sitemap and generateStaticParams. */
export function getAllListingSlugsServer(): Promise<string[]> {
  return unstable_cache(fetchAllListingSlugs, ["listing-slugs"], {
    tags: [LISTINGS_CACHE_TAG],
    revalidate: 300,
  })();
}

export function getListingBySlugServer(slug: string): Promise<Listing | null> {
  return unstable_cache(
    () => fetchListingBySlug(slug),
    ["listing-by-slug", slug],
    { tags: [LISTINGS_CACHE_TAG], revalidate: 300 },
  )();
}

export function getListingStatsServer(): Promise<ListingStats> {
  return unstable_cache(fetchListingStats, ["listing-stats"], {
    tags: [LISTINGS_CACHE_TAG],
    revalidate: 300,
  })();
}

export function getRelatedListingsServer(
  flatType: FlatType,
  excludeSlug: string,
  limit = 4,
): Promise<Listing[]> {
  return unstable_cache(
    () => fetchRelatedListings(flatType, excludeSlug, limit),
    ["related-listings", flatType, excludeSlug, String(limit)],
    { tags: [LISTINGS_CACHE_TAG], revalidate: 300 },
  )();
}

export function getActiveListingsServer(limit?: number): Promise<Listing[]> {
  return unstable_cache(
    () => fetchActiveListings(limit),
    ["active-listings", limit == null ? "all" : String(limit)],
    { tags: [LISTINGS_CACHE_TAG], revalidate: 300 },
  )();
}
