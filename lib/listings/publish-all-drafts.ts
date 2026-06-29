import { createClient } from "@/lib/supabase/client";
import {
  countDraftListingsServer,
  publishAllDraftListingsServer,
} from "@/lib/listings/publish-listings-server";
import { triggerListingRevalidate } from "@/lib/listings/revalidate-listings-client";

export async function publishAllDraftListings(): Promise<number> {
  const supabase = createClient();
  const published = await publishAllDraftListingsServer(supabase);
  if (published > 0) await triggerListingRevalidate();
  return published;
}

export async function countDraftListings(): Promise<number> {
  const supabase = createClient();
  return countDraftListingsServer(supabase);
}
