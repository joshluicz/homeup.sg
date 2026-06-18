import type { FetchAgentPgResult } from "@/lib/listings/fetch-agent-pg-sources";
import { getPgFetchAgentUrl } from "@/lib/listings/pg-fetch-agent-constants";

export type PgFetchAgentResponse = {
  success: boolean;
  results?: FetchAgentPgResult[];
  skipped_agents?: Array<{ agent_slug: string; agent_name: string }>;
  perAgentMode?: unknown[];
  totalNew?: number;
  error?: string;
};

export async function probePgFetchAgent(): Promise<boolean> {
  try {
    const res = await fetch(`${getPgFetchAgentUrl()}/health`, {
      method: "GET",
      mode: "cors",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { ok?: boolean };
    return json.ok === true;
  } catch {
    return false;
  }
}

export async function fetchPgListingHtmlViaAgent(
  pgUrl: string,
  accessToken: string,
): Promise<string> {
  const res = await fetch(`${getPgFetchAgentUrl()}/fetch-listing`, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ url: pgUrl }),
  });

  const text = await res.text();
  let json: { success?: boolean; html?: string; error?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error("Local agent returned an invalid response.");
  }

  if (!res.ok || !json.success || !json.html) {
    throw new Error(json.error ?? "Local agent could not fetch this listing");
  }

  return json.html;
}

export async function fetchPgListingsViaAgent(
  accessToken: string,
): Promise<PgFetchAgentResponse> {
  const res = await fetch(`${getPgFetchAgentUrl()}/fetch`, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fetch_all: true }),
  });

  const text = await res.text();
  let json: PgFetchAgentResponse;
  try {
    json = JSON.parse(text) as PgFetchAgentResponse;
  } catch {
    throw new Error("Local fetch agent returned an invalid response.");
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Local fetch agent failed");
  }

  return json;
}
