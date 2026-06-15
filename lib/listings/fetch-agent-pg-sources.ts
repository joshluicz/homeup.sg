import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "@/lib/data/agents";
import { fetchAgentPgListingsByCea } from "@/lib/listings/fetch-agent-pg-listings";
import type { ParsedPgListingUrl } from "@/lib/listings/pg-url";

export type FetchAgentPgResult = {
  agent_slug: string;
  agent_name: string;
  fetched: number;
  saved: number;
  skipped_duplicates: number;
  error?: string;
};

async function saveFetchedListings(
  supabase: SupabaseClient,
  agentSlug: string,
  listings: ParsedPgListingUrl[],
): Promise<{ saved: number; skipped_duplicates: number }> {
  const { error: deleteError } = await supabase
    .from("pg_listing_sources")
    .delete()
    .eq("agent_slug", agentSlug);

  if (deleteError) throw new Error(deleteError.message);

  let saved = 0;
  let skipped_duplicates = 0;

  for (const entry of listings) {
    const { error } = await supabase.from("pg_listing_sources").insert({
      agent_slug: agentSlug,
      pg_url: entry.pg_url,
      pg_listing_id: entry.pg_listing_id,
    });

    if (error) {
      if (error.code === "23505") {
        skipped_duplicates += 1;
        continue;
      }
      throw new Error(error.message);
    }
    saved += 1;
  }

  return { saved, skipped_duplicates };
}

export async function fetchAndSaveAgentPgListings(
  supabase: SupabaseClient,
  agentSlug: string,
): Promise<FetchAgentPgResult> {
  const agent = AGENTS.find((a) => a.slug === agentSlug);
  if (!agent) {
    return {
      agent_slug: agentSlug,
      agent_name: agentSlug,
      fetched: 0,
      saved: 0,
      skipped_duplicates: 0,
      error: "Unknown agent",
    };
  }

  const { listings, error } = await fetchAgentPgListingsByCea(agent.cea);
  if (error) {
    return {
      agent_slug: agent.slug,
      agent_name: agent.name,
      fetched: 0,
      saved: 0,
      skipped_duplicates: 0,
      error: error === "FETCH_BLOCKED" ? "PropertyGuru blocked the fetch" : error,
    };
  }

  const { saved, skipped_duplicates } = await saveFetchedListings(
    supabase,
    agent.slug,
    listings,
  );

  return {
    agent_slug: agent.slug,
    agent_name: agent.name,
    fetched: listings.length,
    saved,
    skipped_duplicates,
  };
}

export async function fetchAndSaveAllAgentPgListings(
  supabase: SupabaseClient,
): Promise<FetchAgentPgResult[]> {
  const results: FetchAgentPgResult[] = [];
  for (const agent of AGENTS) {
    results.push(await fetchAndSaveAgentPgListings(supabase, agent.slug));
  }
  return results;
}
