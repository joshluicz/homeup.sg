import { createClient } from "@/lib/supabase/client";

export async function publishAllDraftListings(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("status", "draft")
    .is("deleted_at", null)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function countDraftListings(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
