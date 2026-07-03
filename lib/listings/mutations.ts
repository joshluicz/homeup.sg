import { createClient } from "@/lib/supabase/client";
import type { Listing, ListingFormData } from "./types";
import { formDataToDbPayload, validateListingForm } from "./validation";
import { triggerListingRevalidate } from "./revalidate-listings-client";

function mapDbError(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    return new Error("Slug already exists");
  }
  return new Error(error.message);
}

export async function createListing(
  listingId: string,
  data: ListingFormData,
  action: "draft" | "publish",
): Promise<Listing> {
  const validationError = validateListingForm(data);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const status = action === "publish" ? "active" : "draft";
  const payload = formDataToDbPayload(data, status);

  // The slug column is UNIQUE across all rows, including soft-deleted ones.
  // If a previously deleted listing still owns this slug, revive that row with
  // the new data instead of failing with a unique-constraint error.
  const { data: softDeleted } = await supabase
    .from("listings")
    .select("id")
    .eq("slug", payload.slug)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (softDeleted) {
    const { data: revived, error: reviveError } = await supabase
      .from("listings")
      .update({ ...payload, deleted_at: null })
      .eq("id", softDeleted.id)
      .select()
      .single();

    if (reviveError) throw mapDbError(reviveError);
    await triggerListingRevalidate(payload.slug);
    return revived;
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({ ...payload, id: listingId })
    .select()
    .single();

  if (error) throw mapDbError(error);
  await triggerListingRevalidate(payload.slug);
  return listing;
}

export async function updateListing(
  listingId: string,
  data: ListingFormData,
  action: "draft" | "publish",
): Promise<Listing> {
  const validationError = validateListingForm(data);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const status = action === "publish" ? "active" : "draft";
  const payload = formDataToDbPayload(data, status);

  const { data: listing, error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", listingId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) throw mapDbError(error);
  if (!listing) throw new Error("Listing not found");
  await triggerListingRevalidate(payload.slug);
  return listing;
}

export async function deleteListing(listingId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", listingId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Listing not found");
  await triggerListingRevalidate(data.slug as string);
}
