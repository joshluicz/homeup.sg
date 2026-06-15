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
  skipped?: boolean;
  skip_reason?: string;
  error?: string;
};

export type FetchAllPgResult = {
  results: FetchAgentPgResult[];
  skipped_agents: Array<{ agent_slug: string; agent_name: string }>;
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

export async function fetchAndSaveEnabledAgentPgListings(
  supabase: SupabaseClient,
): Promise<FetchAllPgResult> {
  const { data: profiles, error: profilesError } = await supabase
    .from("pg_agent_profiles")
    .select("agent_slug, pg_profile_url");

  if (profilesError) throw new Error(profilesError.message);

  const enabledSlugs = new Set(
    (profiles ?? [])
      .filter((row) => row.pg_profile_url?.trim())
      .map((row) => row.agent_slug as string),
  );

  const results: FetchAgentPgResult[] = [];
  const skipped_agents: Array<{ agent_slug: string; agent_name: string }> = [];

  for (const agent of AGENTS) {
    if (!enabledSlugs.has(agent.slug)) {
      skipped_agents.push({ agent_slug: agent.slug, agent_name: agent.name });
      results.push({
        agent_slug: agent.slug,
        agent_name: agent.name,
        fetched: 0,
        saved: 0,
        skipped_duplicates: 0,
        skipped: true,
        skip_reason: "No PropertyGuru profile URL saved",
      });
      continue;
    }

    results.push(await fetchAndSaveAgentPgListings(supabase, agent.slug));
  }

  return { results, skipped_agents };
}
