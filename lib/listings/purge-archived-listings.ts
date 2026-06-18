import type { SupabaseClient } from "@supabase/supabase-js";

export const ARCHIVE_RETENTION_DAYS = 7;

export async function purgeExpiredArchivedListings(
  supabase: SupabaseClient,
): Promise<{ purged: number; slugs: string[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ARCHIVE_RETENTION_DAYS);

  const { data: expired, error: selectError } = await supabase
    .from("listings")
    .select("id, slug")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff.toISOString());

  if (selectError) throw new Error(selectError.message);
  if (!expired?.length) return { purged: 0, slugs: [] };

  const ids = expired.map((row) => row.id as string);
  const { error: deleteError } = await supabase.from("listings").delete().in("id", ids);

  if (deleteError) throw new Error(deleteError.message);

  return {
    purged: expired.length,
    slugs: expired.map((row) => row.slug as string),
  };
}
