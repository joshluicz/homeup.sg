import { NextResponse } from "next/server";
import { runAdvanceClips } from "@/lib/pipeline/clip-jobs";
import { createPipelineRunLogger } from "@/lib/pipeline/execution-log";
import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

type AdvanceBody = {
  blueprint_id?: string;
};

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
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
    const execution = await createPipelineRunLogger({
      supabase: serviceSupabase,
      workflow: "advance_clips",
      uploadedBy: user?.id,
      subjectType: "blueprint",
      subjectId: body.blueprint_id,
      title: "Advance room clip jobs",
      inputSummary: { blueprint_id: body.blueprint_id },
    });

    try {
      const result = await runAdvanceClips(
        serviceSupabase,
        body.blueprint_id,
        execution,
      );
      await execution.finish(result);
      return NextResponse.json(result);
    } catch (err) {
      await execution.fail(err);
      throw err;
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to advance clip jobs";
    console.error("clips/advance failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
