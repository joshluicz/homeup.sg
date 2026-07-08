import { requireAuth } from "@/lib/supabase/auth";
import { generateArticle } from "@/lib/pipeline/generate";
import { NextResponse } from "next/server";
import type { TopicCandidate } from "@/lib/pipeline/types";

// Article generation involves 3 Claude calls — allow up to 90 seconds
export const maxDuration = 90;

/**
 * POST /api/admin/generate
 * Body: { topic: TopicCandidate }
 * Returns: PackagedArticle
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let topic: TopicCandidate;
  try {
    const body = await request.json();
    topic = body.topic;
    if (!topic?.title) throw new Error("topic.title missing");
  } catch {
    return NextResponse.json({ error: "Request body must be { topic: TopicCandidate }" }, { status: 400 });
  }

  try {
    const result = await generateArticle(topic);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Generation failed", detail: message }, { status: 500 });
  }
}
