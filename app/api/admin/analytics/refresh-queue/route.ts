/**
 * GET  /api/admin/analytics/refresh-queue  — pending refresh items
 * PATCH /api/admin/analytics/refresh-queue  — dismiss or mark refreshed
 *
 * Both routes are admin-gated via requireAuth().
 */

import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export interface RefreshQueueItem {
  id: string;
  slug: string;
  reason: string;
  detail: string | null;
  detected_at: string;
  status: "pending" | "dismissed" | "refreshed";
}

/** GET — returns all pending refresh items, newest-first */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const supabase = createServiceClient();
  const { data, error: dbErr } = await supabase
    .from("refresh_queue")
    .select("id, slug, reason, detail, detected_at, status")
    .eq("status", "pending")
    .order("detected_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

/** PATCH { id, status } — update a queue item (dismiss or mark refreshed) */
export async function PATCH(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let id: string;
  let status: "dismissed" | "refreshed";

  try {
    const body = await request.json() as { id?: string; status?: string };
    id = (body.id ?? "").trim();
    if (!id) throw new Error("id required");
    if (body.status !== "dismissed" && body.status !== "refreshed") {
      throw new Error('status must be "dismissed" or "refreshed"');
    }
    status = body.status;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad request" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { error: dbErr } = await supabase
    .from("refresh_queue")
    .update({ status })
    .eq("id", id);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
