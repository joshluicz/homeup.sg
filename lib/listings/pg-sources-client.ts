import { createClient } from "@/lib/supabase/client";
import { parsePgListingUrlLines, type InvalidPgLine } from "@/lib/listings/pg-url";

export type PgListingSource = {
  id: string;
  agent_slug: string;
  pg_url: string;
  pg_listing_id: string;
  created_at: string;
};

export async function loadPgSources(): Promise<PgListingSource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pg_listing_sources")
    .select("id, agent_slug, pg_url, pg_listing_id, created_at")
    .order("agent_slug", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PgListingSource[];
}

export async function savePgSourcesForAgent(
  agentSlug: string,
  urlsText: string,
): Promise<{ saved: number; invalid: InvalidPgLine[] }> {
  const supabase = createClient();
  const { valid, invalid } = parsePgListingUrlLines(urlsText);

  const { error: deleteError } = await supabase
    .from("pg_listing_sources")
    .delete()
    .eq("agent_slug", agentSlug);

  if (deleteError) throw new Error(deleteError.message);

  if (valid.length > 0) {
    const { error: insertError } = await supabase.from("pg_listing_sources").insert(
      valid.map((entry) => ({
        agent_slug: agentSlug,
        pg_url: entry.pg_url,
        pg_listing_id: entry.pg_listing_id,
      })),
    );

    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error(
          "One of these links is already saved under another agent. Each PropertyGuru listing can only appear once.",
        );
      }
      throw new Error(insertError.message);
    }
  }

  return { saved: valid.length, invalid };
}
