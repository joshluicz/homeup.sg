import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchListingsFromGoogleSheet,
  type FetchSheetListingsResult,
  type SheetListingRow,
} from "@/lib/listings/google-sheet-listings";
import { propertySlugFromPgUrl } from "@/lib/listings/pg-url";

export type SyncSheetSourcesResult = FetchSheetListingsResult & {
  saved: number;
  by_agent: Record<string, number>;
  price_updates: Array<{
    pg_listing_id: string;
    slug: string;
    old_price: number;
    new_price: number;
  }>;
  linked_manual: Array<{
    pg_listing_id: string;
    slug: string;
  }>;
};

type PgSourceInsert = {
  agent_slug: string;
  pg_url: string;
  pg_listing_id: string;
  listed_price?: number | null;
};

export async function replacePgSourcesFromSheet(
  supabase: SupabaseClient,
  active: SheetListingRow[],
): Promise<{ saved: number; by_agent: Record<string, number> }> {
  const { error: deleteError } = await supabase
    .from("pg_listing_sources")
    .delete()
    .not("id", "is", null);

  if (deleteError) throw new Error(deleteError.message);

  if (active.length === 0) {
    return { saved: 0, by_agent: {} };
  }

  const rowsWithPrice: PgSourceInsert[] = active.map((row) => ({
    agent_slug: row.agent_slug,
    pg_url: row.pg_url,
    pg_listing_id: row.pg_listing_id,
    listed_price: row.listed_price,
  }));

  const { error: insertError } = await supabase.from("pg_listing_sources").insert(rowsWithPrice);

  if (insertError && /listed_price/i.test(insertError.message)) {
    const rowsWithoutPrice = rowsWithPrice.map(({ listed_price: _listedPrice, ...row }) => row);
    const { error: retryError } = await supabase.from("pg_listing_sources").insert(rowsWithoutPrice);
    if (retryError) throw new Error(retryError.message);
  } else if (insertError) {
    throw new Error(insertError.message);
  }

  const by_agent: Record<string, number> = {};
  for (const row of active) {
    by_agent[row.agent_name] = (by_agent[row.agent_name] ?? 0) + 1;
  }

  return { saved: active.length, by_agent };
}

export async function linkManualListingsFromSheet(
  supabase: SupabaseClient,
  active: SheetListingRow[],
): Promise<SyncSheetSourcesResult["linked_manual"]> {
  const sourceBySlug = new Map<string, SheetListingRow>();
  for (const row of active) {
    const slug = propertySlugFromPgUrl(row.pg_url);
    if (slug) sourceBySlug.set(slug, row);
  }

  if (sourceBySlug.size === 0) return [];

  const { data: manualListings, error } = await supabase
    .from("listings")
    .select("id, slug")
    .is("source_pg_listing_id", null)
    .is("deleted_at", null)
    .in("slug", [...sourceBySlug.keys()]);

  if (error) throw new Error(error.message);

  const linked: SyncSheetSourcesResult["linked_manual"] = [];

  for (const listing of manualListings ?? []) {
    const slug = listing.slug as string;
    const source = sourceBySlug.get(slug);
    if (!source) continue;

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        source_pg_url: source.pg_url,
        source_pg_listing_id: source.pg_listing_id,
      })
      .eq("id", listing.id);

    if (updateError) throw new Error(updateError.message);

    linked.push({
      pg_listing_id: source.pg_listing_id,
      slug,
    });
  }

  return linked;
}

export async function updateListingPricesFromSheet(
  supabase: SupabaseClient,
  active: SheetListingRow[],
): Promise<SyncSheetSourcesResult["price_updates"]> {
  const priceByPgId = new Map(
    active
      .filter((row) => row.listed_price != null)
      .map((row) => [row.pg_listing_id, row.listed_price as number]),
  );

  if (priceByPgId.size === 0) return [];

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, slug, price, source_pg_listing_id")
    .in("source_pg_listing_id", [...priceByPgId.keys()])
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const updates: SyncSheetSourcesResult["price_updates"] = [];

  for (const listing of listings ?? []) {
    const pgListingId = listing.source_pg_listing_id as string;
    const nextPrice = priceByPgId.get(pgListingId);
    if (nextPrice == null) continue;

    const oldPrice = Math.round(Number(listing.price));
    if (oldPrice === nextPrice) continue;

    const { error: updateError } = await supabase
      .from("listings")
      .update({ price: nextPrice })
      .eq("id", listing.id);

    if (updateError) throw new Error(updateError.message);

    updates.push({
      pg_listing_id: pgListingId,
      slug: listing.slug as string,
      old_price: oldPrice,
      new_price: nextPrice,
    });
  }

  return updates;
}

export async function refreshPgSourcesFromGoogleSheet(
  supabase: SupabaseClient,
): Promise<SyncSheetSourcesResult> {
  const sheet = await fetchListingsFromGoogleSheet();
  const { saved, by_agent } = await replacePgSourcesFromSheet(supabase, sheet.active);
  const linked_manual = await linkManualListingsFromSheet(supabase, sheet.active);
  const price_updates = await updateListingPricesFromSheet(supabase, sheet.active);
  return { ...sheet, saved, by_agent, linked_manual, price_updates };
}
