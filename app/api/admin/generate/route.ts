import { requireAuth } from "@/lib/supabase/auth";
import { generateArticle } from "@/lib/pipeline/generate";
import { requireAnthropicApiKey } from "@/lib/pipeline/llm";
import { resolveGenerationTopic } from "@/lib/pipeline/radar";
import { NextResponse } from "next/server";
import type { TopicCandidate } from "@/lib/pipeline/types";

// Article generation involves 3 Claude calls — allow up to 90 seconds
export const maxDuration = 90;

/**
 * POST /api/admin/generate
 * Body: { topic?: TopicCandidate, auto?: boolean }
 *   - Pass { auto: true } or omit topic → radar picks top unpublished topic
 * Returns: PackagedArticle + optional selectedTopic when auto-picked
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    requireAnthropicApiKey();
  } catch (err) {
    const message = err instanceof Error ? err.message : "ANTHROPIC_API_KEY is not configured";
    return NextResponse.json({ error: "Configuration error", detail: message }, { status: 503 });
  }

  let body: { topic?: TopicCandidate; auto?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is valid for auto-generate
    body = {};
  }

  const wantsAuto = body.auto === true || !body.topic?.title?.trim();
  const resolved = await resolveGenerationTopic(wantsAuto ? null : body.topic);

  if (resolved.status === "all_covered") {
    return NextResponse.json(
      {
        error: "NO_UNPUBLISHED_TOPICS",
        detail:
          "Every trending topic is already on the Playbook — add new seeds in radarConfig.ts or enter a custom topic below.",
      },
      { status: 404 },
    );
  }

  if (resolved.status === "topic_covered") {
    return NextResponse.json(
      {
        error: "TOPIC_ALREADY_COVERED",
        detail: `This topic is already covered by "${resolved.matchedArticle.title}".`,
        matchedArticle: resolved.matchedArticle,
      },
      { status: 409 },
    );
  }

  const { topic, autoSelected } = resolved;

  try {
    const result = await generateArticle(topic);
    return NextResponse.json({
      ...result,
      ...(autoSelected ? { selectedTopic: topic } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate] pipeline failed:", message);
    return NextResponse.json({ error: "Generation failed", detail: message }, { status: 500 });
  }
}
