import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "@/lib/data/agents";
import { listedAsFromPgUrl, propertySlugFromPgUrl } from "@/lib/listings/pg-url";
import type { ListedAs } from "@/lib/listings/types";

export type PgSyncPreview = {
  to_import: Array<{
    pg_url: string;
    pg_listing_id: string;
    agent_slug: string;
    agent_name: string;
  }>;
  to_archive: Array<{
    title: string;
    slug: string;
    source_pg_url: string | null;
  }>;
  unchanged: number;
  source_count: number;
};

type ActiveListing = {
  slug: string;
  listed_as: ListedAs;
  source_pg_listing_id: string;
};

function listingCoversPgSource(
  listing: ActiveListing,
  propertySlug: string,
  listedAs: ListedAs,
): boolean {
  const baseSlug = listing.slug.replace(/-(rent|sell)$/, "");
  if (baseSlug !== propertySlug) return false;
  return listing.listed_as === listedAs;
}

function isAlternatePgSource(
  source: { pg_url: string; pg_listing_id: string },
  homeupPgIds: Set<string>,
  activeListings: ActiveListing[],
): boolean {
  if (homeupPgIds.has(source.pg_listing_id)) return true;

  const propertySlug = propertySlugFromPgUrl(source.pg_url);
  if (!propertySlug) return false;

  const listedAs = listedAsFromPgUrl(source.pg_url);
  return activeListings.some((listing) =>
    listingCoversPgSource(listing, propertySlug, listedAs),
  );
}

export async function getPgSyncPreview(
  supabase: SupabaseClient,
): Promise<PgSyncPreview> {
  const { data: sources, error: sourcesError } = await supabase
    .from("pg_listing_sources")
    .select("agent_slug, pg_url, pg_listing_id");

  if (sourcesError) throw new Error(sourcesError.message);

  const sourceRows = sources ?? [];
  const sourceIds = new Set(sourceRows.map((row) => row.pg_listing_id as string));

  const agentNameBySlug = new Map(AGENTS.map((a) => [a.slug, a.name]));

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("title, slug, source_pg_listing_id, source_pg_url, listed_as")
    .not("source_pg_listing_id", "is", null)
    .is("deleted_at", null);

  if (listingsError) throw new Error(listingsError.message);

  const activeListings = (listings ?? []) as ActiveListing[];
  const homeupPgIds = new Set(activeListings.map((row) => row.source_pg_listing_id));

  const to_import = sourceRows
    .filter(
      (row) =>
        !isAlternatePgSource(
          { pg_url: row.pg_url as string, pg_listing_id: row.pg_listing_id as string },
          homeupPgIds,
          activeListings,
        ),
    )
    .map((row) => ({
      pg_url: row.pg_url as string,
      pg_listing_id: row.pg_listing_id as string,
      agent_slug: row.agent_slug as string,
      agent_name: agentNameBySlug.get(row.agent_slug as string) ?? row.agent_slug,
    }));

  const to_archive = (listings ?? [])
    .filter((row) => !sourceIds.has(row.source_pg_listing_id as string))
    .map((row) => ({
      title: row.title as string,
      slug: row.slug as string,
      source_pg_url: row.source_pg_url as string | null,
    }));

  const unchanged = sourceRows.filter((row) =>
    isAlternatePgSource(
      { pg_url: row.pg_url as string, pg_listing_id: row.pg_listing_id as string },
      homeupPgIds,
      activeListings,
    ),
  ).length;

  return { to_import, to_archive, unchanged, source_count: sourceRows.length };
}
