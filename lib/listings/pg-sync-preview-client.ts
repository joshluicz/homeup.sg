import type { SupabaseClient } from "@supabase/supabase-js";
import { getPgSyncPreview, type PgSyncPreview } from "@/lib/listings/pg-sync-preview";

export async function loadPgSyncPreview(
  supabase: SupabaseClient,
): Promise<PgSyncPreview> {
  return getPgSyncPreview(supabase);
}

export type { PgSyncPreview };
