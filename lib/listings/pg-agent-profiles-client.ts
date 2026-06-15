import { createClient } from "@/lib/supabase/client";
import { AGENTS } from "@/lib/data/agents";
import { parsePgAgentProfileUrl } from "@/lib/listings/pg-url";

export type PgAgentProfile = {
  agent_slug: string;
  pg_profile_url: string | null;
  updated_at: string;
};

export async function loadPgAgentProfiles(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pg_agent_profiles")
    .select("agent_slug, pg_profile_url");

  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.pg_profile_url) {
      map[row.agent_slug as string] = row.pg_profile_url as string;
    }
  }
  return map;
}

export async function savePgAgentProfiles(
  profiles: Record<string, string>,
): Promise<{ saved: number; errors: string[] }> {
  const supabase = createClient();
  let saved = 0;
  const errors: string[] = [];

  for (const agent of AGENTS) {
    const raw = profiles[agent.slug]?.trim() ?? "";
    if (!raw) {
      const { error } = await supabase
        .from("pg_agent_profiles")
        .delete()
        .eq("agent_slug", agent.slug);
      if (error) errors.push(`${agent.name}: ${error.message}`);
      continue;
    }

    const url = parsePgAgentProfileUrl(raw);
    if (!url) {
      errors.push(`${agent.name}: invalid agent profile URL`);
      continue;
    }

    const { error } = await supabase.from("pg_agent_profiles").upsert({
      agent_slug: agent.slug,
      pg_profile_url: url,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      errors.push(`${agent.name}: ${error.message}`);
      continue;
    }
    saved += 1;
  }

  return { saved, errors };
}

export async function getEnabledAgentSlugs(): Promise<string[]> {
  const profiles = await loadPgAgentProfiles();
  return Object.keys(profiles).filter((slug) => profiles[slug]?.trim());
}
