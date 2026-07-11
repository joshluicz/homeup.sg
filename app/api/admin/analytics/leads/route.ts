/**
 * GET /api/admin/analytics/leads
 * Returns per-slug WhatsApp click counts from the lead_events table.
 * Admin-gated via requireAuth().
 */

import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export interface LeadCount {
  slug: string;
  count: number;
  lastClick: string | null;
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const startIso = searchParams.get("startIso");
  const endIso = searchParams.get("endIso");

  const supabase = createServiceClient();
  let query = supabase
    .from("lead_events")
    .select("slug, created_at")
    .order("created_at", { ascending: false });

  if (startIso) query = query.gte("created_at", `${startIso}T00:00:00.000Z`);
  if (endIso) {
    const endExclusive = new Date(endIso);
    endExclusive.setDate(endExclusive.getDate() + 1);
    query = query.lt("created_at", endExclusive.toISOString());
  }

  const { data, error: dbError } = await query;

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Aggregate per slug in memory (table stays small)
  const map = new Map<string, { count: number; lastClick: string }>();
  for (const row of data ?? []) {
    const existing = map.get(row.slug);
    if (!existing) {
      map.set(row.slug, { count: 1, lastClick: row.created_at });
    } else {
      existing.count++;
      if (row.created_at > existing.lastClick) existing.lastClick = row.created_at;
    }
  }

  const leads: LeadCount[] = Array.from(map.entries())
    .map(([slug, { count, lastClick }]) => ({ slug, count, lastClick }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(leads);
}
