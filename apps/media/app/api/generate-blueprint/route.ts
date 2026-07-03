import { NextResponse } from "next/server";
import {
  createPipelineRunLogger,
  summarizeGenerateBody,
} from "@/lib/pipeline/execution-log";
import { runGenerateBlueprint } from "@/lib/pipeline/generate-blueprint";
import { requireAuth } from "@/lib/supabase/auth";
import { tryCreateServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputSummary = summarizeGenerateBody(body);
  const execution = await createPipelineRunLogger({
    supabase: tryCreateServiceClient(),
    workflow: "generate_blueprint",
    uploadedBy: user?.id,
    subjectType: "blueprint",
    title:
      typeof inputSummary.address === "string"
        ? inputSummary.address
        : "Blueprint generation",
    inputSummary,
  });

  try {
    const result = await runGenerateBlueprint(supabase, body, execution);
    await execution.finish({ blueprint_id: result.blueprint_id });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Blueprint generation failed";
    console.error("generate-blueprint failed:", err);
    await execution.fail(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
