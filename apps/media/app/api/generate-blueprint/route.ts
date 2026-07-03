import { NextResponse } from "next/server";
import { runGenerateBlueprint } from "@/lib/pipeline/generate-blueprint";
import { requireAuth } from "@/lib/supabase/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await runGenerateBlueprint(supabase, body);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Blueprint generation failed";
    console.error("generate-blueprint failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
