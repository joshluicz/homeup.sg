import { requireAuth } from "@/lib/supabase/auth";
import { generateArticle } from "@/lib/pipeline/generate";
import { pickTopUnpublishedTopic, runRadar } from "@/lib/pipeline/radar";
import { NextResponse } from "next/server";
import type { TopicCandidate } from "@/lib/pipeline/types";

// Article generation involves 3 Claude calls — allow up to 90 seconds
export const maxDuration = 90;

/**
 * POST /api/admin/generate
 * Body: { topic?: TopicCandidate } — omit topic for auto-pick (top unpublished radar topic)
 * Returns: PackagedArticle + optional selectedTopic when auto-picked
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let topic: TopicCandidate | undefined;
  let autoSelected = false;

  try {
    const body = await request.json().catch(() => ({}));
    topic = body.topic;
    if (!topic?.title) {
      const topics = await runRadar();
      topic = pickTopUnpublishedTopic(topics) ?? undefined;
      autoSelected = true;
      if (!topic) {
        return NextResponse.json(
          { error: "No unpublished topics available", detail: "All radar topics match live articles." },
          { status: 404 },
        );
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Request body must be { topic?: TopicCandidate }" },
      { status: 400 },
    );
  }

  try {
    const result = await generateArticle(topic);
    return NextResponse.json({
      ...result,
      ...(autoSelected ? { selectedTopic: topic } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Generation failed", detail: message }, { status: 500 });
  }
}
