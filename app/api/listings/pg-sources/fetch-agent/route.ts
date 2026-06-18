import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import {
  fetchAndSaveEnabledAgentPgListings,
} from "@/lib/listings/fetch-agent-pg-sources";

export const maxDuration = 300;

export async function POST(request: Request) {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  let body: { agent_slug?: string; fetch_all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.fetch_all) {
      const { results, skipped_agents, perAgentMode, totalNew } =
        await fetchAndSaveEnabledAgentPgListings(supabase);
      return NextResponse.json({
        success: true,
        results,
        skipped_agents,
        perAgentMode,
        totalNew,
      });
    }

    const agentSlug = body.agent_slug?.trim();
    if (!agentSlug) {
      return NextResponse.json({ error: "agent_slug or fetch_all is required" }, { status: 400 });
    }

    const { results, perAgentMode, totalNew } = await fetchAndSaveEnabledAgentPgListings(
      supabase,
      agentSlug,
    );
    return NextResponse.json({
      success: true,
      results,
      perAgentMode,
      totalNew,
    });
  } catch (err) {
    console.error("[fetch-agent]", err);
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
