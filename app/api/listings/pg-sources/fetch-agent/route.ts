import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import {
  fetchAndSaveAgentPgListings,
  fetchAndSaveAllAgentPgListings,
} from "@/lib/listings/fetch-agent-pg-sources";

export const maxDuration = 120;

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
      const results = await fetchAndSaveAllAgentPgListings(supabase);
      return NextResponse.json({ success: true, results });
    }

    const agentSlug = body.agent_slug?.trim();
    if (!agentSlug) {
      return NextResponse.json({ error: "agent_slug or fetch_all is required" }, { status: 400 });
    }

    const result = await fetchAndSaveAgentPgListings(supabase, agentSlug);
    return NextResponse.json({ success: true, results: [result] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
