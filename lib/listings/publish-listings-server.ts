import type { SupabaseClient } from "@supabase/supabase-js";

export async function publishAllDraftListingsServer(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("status", "draft")
    .is("deleted_at", null)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function countDraftListingsServer(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
