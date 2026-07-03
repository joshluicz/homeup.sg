import { NextResponse } from "next/server";
import { runAdvanceClips } from "@/lib/pipeline/clip-jobs";
import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

type AdvanceBody = {
  blueprint_id?: string;
};

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: AdvanceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.blueprint_id) {
    return NextResponse.json(
      { error: "blueprint_id is required" },
      { status: 400 },
    );
  }

  try {
    const serviceSupabase = createServiceClient();
    const result = await runAdvanceClips(serviceSupabase, body.blueprint_id);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to advance clip jobs";
    console.error("clips/advance failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
