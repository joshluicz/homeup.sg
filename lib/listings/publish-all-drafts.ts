import { createClient } from "@/lib/supabase/client";
import {
  countDraftListingsServer,
  publishAllDraftListingsServer,
} from "@/lib/listings/publish-listings-server";

export async function publishAllDraftListings(): Promise<number> {
  const supabase = createClient();
  return publishAllDraftListingsServer(supabase);
}

export async function countDraftListings(): Promise<number> {
  const supabase = createClient();
  return countDraftListingsServer(supabase);
}
