import type { SupabaseClient } from "@supabase/supabase-js";
import { runListingImport } from "@/lib/listings/import/run-import";
import type { ListingFormData } from "@/lib/listings/types";
import { formDataToDbPayload, validateListingForm } from "@/lib/listings/validation";

const IMPORT_DELAY_MS = 1500;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFormData(partial: Partial<ListingFormData>): ListingFormData {
  return { ...DEFAULT_FORM, ...partial, negotiable: "negotiable" };
}

export async function runPgListingSync(supabase: SupabaseClient): Promise<PgSyncResult> {
  const result: PgSyncResult = {
    added: [],
    skipped: 0,
    archived: [],
    failed: [],
  };

  const { data: sources, error: sourcesError } = await supabase
    .from("pg_listing_sources")
    .select("pg_url, pg_listing_id")
    .order("created_at", { ascending: true });

  if (sourcesError) {
    throw new Error(sourcesError.message);
  }

  const sourceIds = new Set((sources ?? []).map((row) => row.pg_listing_id as string));
  const sourceById = new Map(
    (sources ?? []).map((row) => [row.pg_listing_id as string, row.pg_url as string]),
  );

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, title, slug, source_pg_listing_id")
    .not("source_pg_listing_id", "is", null)
    .is("deleted_at", null);

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  const existingPgIds = new Set<string>();

  for (const listing of listings ?? []) {
    const pgId = listing.source_pg_listing_id as string;
    existingPgIds.add(pgId);

    if (!sourceIds.has(pgId)) {
      const { error } = await supabase
        .from("listings")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", listing.id);

      if (error) {
        result.failed.push({ pg_url: pgId, error: error.message });
        continue;
      }

      result.archived.push({
        title: listing.title as string,
        slug: listing.slug as string,
      });
    }
  }

  for (const pgListingId of sourceIds) {
    if (existingPgIds.has(pgListingId)) {
      result.skipped += 1;
      continue;
    }

    const pgUrl = sourceById.get(pgListingId);
    if (!pgUrl) continue;

    const listingId = crypto.randomUUID();

    try {
      const importResult = await runListingImport(supabase, {
        url: pgUrl,
        listingId,
      });

      if (!importResult.success) {
        result.failed.push({ pg_url: pgUrl, error: importResult.error });
        await sleep(IMPORT_DELAY_MS);
        continue;
      }

      const formData = toFormData(importResult.data);
      const validationError = validateListingForm(formData);
      if (validationError) {
        result.failed.push({ pg_url: pgUrl, error: validationError });
        await sleep(IMPORT_DELAY_MS);
        continue;
      }

      const payload = formDataToDbPayload(formData, "draft", {
        source_pg_url: pgUrl,
        source_pg_listing_id: pgListingId,
      });

      const { error: insertError } = await supabase.from("listings").insert({
        id: listingId,
        ...payload,
      });

      if (insertError) {
        result.failed.push({ pg_url: pgUrl, error: insertError.message });
        await sleep(IMPORT_DELAY_MS);
        continue;
      }

      result.added.push({
        title: formData.title,
        slug: formData.slug,
        pg_url: pgUrl,
      });
    } catch (err) {
      result.failed.push({
        pg_url: pgUrl,
        error: err instanceof Error ? err.message : "Import failed",
      });
    }

    await sleep(IMPORT_DELAY_MS);
  }

  return result;
}
