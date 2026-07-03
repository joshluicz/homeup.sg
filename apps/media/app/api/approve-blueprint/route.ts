import { NextResponse } from "next/server";
import { runApproveBlueprint } from "@/lib/pipeline/clip-jobs";
import {
  createPipelineRunLogger,
  summarizeApproveBody,
} from "@/lib/pipeline/execution-log";
import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const serviceSupabase = createServiceClient();
    const inputSummary = summarizeApproveBody(body);
    const execution = await createPipelineRunLogger({
      supabase: serviceSupabase,
      workflow: "approve_blueprint",
      uploadedBy: user?.id,
      subjectType: "blueprint",
      subjectId:
        typeof inputSummary.blueprint_id === "string"
          ? inputSummary.blueprint_id
          : undefined,
      title: "Approve blueprint and start clips",
      inputSummary,
    });

    try {
      const result = await runApproveBlueprint(
        supabase,
        serviceSupabase,
        body,
        execution,
      );
      await execution.finish({ room_count: result.room_count });
      return NextResponse.json(result);
    } catch (err) {
      await execution.fail(err);
      throw err;
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Clip generation failed to start";
    console.error("approve-blueprint failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
