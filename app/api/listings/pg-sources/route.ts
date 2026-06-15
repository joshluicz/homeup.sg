import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { parsePgListingUrlLines } from "@/lib/listings/pg-url";

export async function GET() {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error } = await supabase
    .from("pg_listing_sources")
    .select("id, agent_slug, pg_url, pg_listing_id, created_at")
    .order("agent_slug", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data ?? [] });
}

export async function PUT(request: Request) {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  let body: { agent_slug?: string; urls_text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const agentSlug = body.agent_slug?.trim();
  if (!agentSlug) {
    return NextResponse.json({ error: "agent_slug is required" }, { status: 400 });
  }

  const { valid, invalid } = parsePgListingUrlLines(body.urls_text ?? "");

  const { error: deleteError } = await supabase
    .from("pg_listing_sources")
    .delete()
    .eq("agent_slug", agentSlug);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (valid.length > 0) {
    const { error: insertError } = await supabase.from("pg_listing_sources").insert(
      valid.map((entry) => ({
        agent_slug: agentSlug,
        pg_url: entry.pg_url,
        pg_listing_id: entry.pg_listing_id,
      })),
    );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    saved: valid.length,
    invalid,
  });
}
