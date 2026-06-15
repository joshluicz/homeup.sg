import { createClient } from "@/lib/supabase/client";
import { AGENTS } from "@/lib/data/agents";
import { parsePgAgentSourceInput } from "@/lib/listings/pg-url";

export async function loadPgAgentProfiles(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pg_agent_profiles")
    .select("agent_slug, pg_profile_url, pg_listed_by_id");

  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.pg_profile_url) {
      map[row.agent_slug as string] = row.pg_profile_url as string;
    } else if (row.pg_listed_by_id) {
      map[row.agent_slug as string] =
        `https://www.propertyguru.com.sg/property-for-sale?listedById=${row.pg_listed_by_id}`;
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

    const parsed = parsePgAgentSourceInput(raw);
    if (!parsed) {
      errors.push(
        `${agent.name}: paste an agent profile URL or a property-for-sale?listedById=… link`,
      );
      continue;
    }

    const { error } = await supabase.from("pg_agent_profiles").upsert({
      agent_slug: agent.slug,
      pg_profile_url: parsed.pg_profile_url,
      pg_listed_by_id: parsed.pg_listed_by_id,
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
