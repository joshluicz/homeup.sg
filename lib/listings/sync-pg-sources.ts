import type { SupabaseClient } from "@supabase/supabase-js";
import { runListingImport } from "@/lib/listings/import/run-import";
import type { ListingFormData } from "@/lib/listings/types";
import { formDataToDbPayload, validateListingForm } from "@/lib/listings/validation";

const DEFAULT_FORM: ListingFormData = {
  title: "",
  slug: "",
  status: "draft",
  listed_as: "sell",
  is_sold: false,
  is_featured: false,
  price: 0,
  negotiable: "negotiable",
  area_sqft: 0,
  flat_type: "condominium",
  condition: "no_furnishing",
  rooms: null,
  bathrooms: null,
  tenure: null,
  is_freehold: false,
  address_line_1: "",
  featured_image_url: null,
  image_urls: [],
};

export type PgSyncResult = {
  added: Array<{ title: string; slug: string; pg_url: string }>;
  skipped: number;
  archived: Array<{ title: string; slug: string }>;
  failed: Array<{ pg_url: string; error: string }>;
};

function toFormData(partial: Partial<ListingFormData>): ListingFormData {
  return { ...DEFAULT_FORM, ...partial, negotiable: "negotiable" };
}

export async function archiveRemovedPgListings(
  supabase: SupabaseClient,
): Promise<Array<{ title: string; slug: string }>> {
  const archived: Array<{ title: string; slug: string }> = [];

  const { data: sources, error: sourcesError } = await supabase
    .from("pg_listing_sources")
    .select("pg_listing_id");

  if (sourcesError) throw new Error(sourcesError.message);

  const sourceIds = new Set((sources ?? []).map((row) => row.pg_listing_id as string));

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, title, slug, source_pg_listing_id")
    .not("source_pg_listing_id", "is", null)
    .is("deleted_at", null);

  if (listingsError) throw new Error(listingsError.message);

  for (const listing of listings ?? []) {
    const pgId = listing.source_pg_listing_id as string;
    if (sourceIds.has(pgId)) continue;

    const { error } = await supabase
      .from("listings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", listing.id);

    if (error) throw new Error(error.message);

    archived.push({
      title: listing.title as string,
      slug: listing.slug as string,
    });
  }

  return archived;
}

export async function importOnePgListing(
  supabase: SupabaseClient,
  pgUrl: string,
  pgListingId: string,
): Promise<{ ok: true; title: string; slug: string } | { ok: false; error: string }> {
  const { data: existingByPgId } = await supabase
    .from("listings")
    .select("id, deleted_at")
    .eq("source_pg_listing_id", pgListingId)
    .maybeSingle();

  if (existingByPgId && !existingByPgId.deleted_at) {
    return { ok: false, error: "Already imported" };
  }

  const listingId = existingByPgId?.id ?? crypto.randomUUID();

  const importResult = await runListingImport(supabase, {
    url: pgUrl,
    listingId,
  });

  if (!importResult.success) {
    return { ok: false, error: importResult.error };
  }

  const formData = toFormData(importResult.data);
  const validationError = validateListingForm(formData);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const payload = formDataToDbPayload(formData, "draft", {
    source_pg_url: pgUrl,
    source_pg_listing_id: pgListingId,
  });

  if (existingByPgId?.deleted_at) {
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        ...payload,
        deleted_at: null,
      })
      .eq("id", listingId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, title: formData.title, slug: formData.slug };
  }

  const { data: archivedBySlug } = await supabase
    .from("listings")
    .select("id")
    .eq("slug", formData.slug)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (archivedBySlug) {
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        ...payload,
        deleted_at: null,
      })
      .eq("id", archivedBySlug.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, title: formData.title, slug: formData.slug };
  }

  const { data: activeBySlug } = await supabase
    .from("listings")
    .select("id, source_pg_listing_id")
    .eq("slug", formData.slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (activeBySlug) {
    const { error: updateError } = await supabase
      .from("listings")
      .update(payload)
      .eq("id", activeBySlug.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, title: formData.title, slug: formData.slug };
  }

  const { error: insertError } = await supabase.from("listings").insert({
    id: listingId,
    ...payload,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true, title: formData.title, slug: formData.slug };
}

/** @deprecated Prefer client-side loop via importOnePgListing */
export async function runPgListingSync(supabase: SupabaseClient): Promise<PgSyncResult> {
  const result: PgSyncResult = {
    added: [],
    skipped: 0,
    archived: [],
    failed: [],
  };

  result.archived = await archiveRemovedPgListings(supabase);

  const { data: sources, error: sourcesError } = await supabase
    .from("pg_listing_sources")
    .select("pg_url, pg_listing_id");

  if (sourcesError) throw new Error(sourcesError.message);

  for (const row of sources ?? []) {
    const pgUrl = row.pg_url as string;
    const pgListingId = row.pg_listing_id as string;

    const outcome = await importOnePgListing(supabase, pgUrl, pgListingId);
    if (outcome.ok) {
      result.added.push({ title: outcome.title, slug: outcome.slug, pg_url: pgUrl });
    } else if (outcome.error === "Already imported") {
      result.skipped += 1;
    } else {
      result.failed.push({ pg_url: pgUrl, error: outcome.error });
    }
  }

  return result;
}
