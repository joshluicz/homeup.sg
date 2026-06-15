import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "@/lib/data/agents";
import {
  fetchPgListingsWithPatchright,
  type PerAgentModeResult,
} from "@/lib/listings/fetch-agent-pg-patchright";

export type FetchAgentPgResult = {
  agent_slug: string;
  agent_name: string;
  fetched: number;
  saved: number;
  skipped_duplicates: number;
  skipped?: boolean;
  skip_reason?: string;
  fetch_method?: "patchright";
  error?: string;
};

export type FetchAllPgResult = {
  results: FetchAgentPgResult[];
  skipped_agents: Array<{ agent_slug: string; agent_name: string }>;
  perAgentMode: PerAgentModeResult[];
  totalNew: number;
};

function aggregateResults(perAgentMode: PerAgentModeResult[]): FetchAgentPgResult[] {
  const byAgent = new Map<string, FetchAgentPgResult>();

  for (const row of perAgentMode) {
    const current = byAgent.get(row.agent_slug) ?? {
      agent_slug: row.agent_slug,
      agent_name: row.agent_name,
      fetched: 0,
      saved: 0,
      skipped_duplicates: 0,
      fetch_method: "patchright" as const,
    };

    if (row.error === "No listedById saved") {
      current.skipped = true;
      current.skip_reason = "No PropertyGuru URL saved";
      byAgent.set(row.agent_slug, current);
      continue;
    }

    current.fetched += row.found;
    current.saved += row.new;
    // found is unique per mode; saved is rows actually inserted
    current.skipped_duplicates += Math.max(0, row.found - row.new);

    if (row.error && !current.error) {
      current.error = row.error;
    }

    byAgent.set(row.agent_slug, current);
  }

  return Array.from(byAgent.values());
}

function skippedAgents(results: FetchAgentPgResult[]): Array<{ agent_slug: string; agent_name: string }> {
  return results
    .filter((r) => r.skipped)
    .map((r) => ({ agent_slug: r.agent_slug, agent_name: r.agent_name }));
}

export async function fetchAndSaveAgentPgListings(
  supabase: SupabaseClient,
  agentSlug: string,
): Promise<FetchAgentPgResult> {
  const { perAgentMode, totalNew: _totalNew } = await fetchPgListingsWithPatchright(supabase, agentSlug);
  const results = aggregateResults(perAgentMode);
  return (
    results.find((r) => r.agent_slug === agentSlug) ?? {
      agent_slug: agentSlug,
      agent_name: agentSlug,
      fetched: 0,
      saved: 0,
      skipped_duplicates: 0,
      error: "Unknown agent",
    }
  );
}

export async function fetchAndSaveEnabledAgentPgListings(
  supabase: SupabaseClient,
  onlyAgentSlug?: string,
): Promise<FetchAllPgResult> {
  const { perAgentMode, totalNew } = await fetchPgListingsWithPatchright(supabase, onlyAgentSlug);
  const results = aggregateResults(perAgentMode);

  for (const agent of AGENTS) {
    if (onlyAgentSlug && agent.slug !== onlyAgentSlug) continue;
    if (results.some((r) => r.agent_slug === agent.slug)) continue;
    results.push({
      agent_slug: agent.slug,
      agent_name: agent.name,
      fetched: 0,
      saved: 0,
      skipped_duplicates: 0,
      skipped: true,
      skip_reason: "No PropertyGuru URL saved",
      fetch_method: "patchright",
    });
  }

  return {
    results,
    skipped_agents: skippedAgents(results),
    perAgentMode,
    totalNew,
  };
}
