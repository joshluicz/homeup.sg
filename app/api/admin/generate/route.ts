import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import type { TopicCandidate } from "@/lib/pipeline/types";

// Article generation involves 3 Claude calls — allow up to 90 seconds (Vercel Pro).
export const maxDuration = 90;
export const dynamic = "force-dynamic";

/** Lightweight health probe — must not import pipeline/LLM modules at load time. */
export async function GET() {
  return NextResponse.json({ ok: true, route: "admin/generate" });
}

/**
 * POST /api/admin/generate
 * Body: { topic?: TopicCandidate, auto?: boolean, refresh?: boolean, authorSlug?: string }
 *   - Pass { auto: true } or omit topic → radar picks a random top unpublished topic
 *   - Pass { authorSlug } to override auto author assignment (omit for topic-based auto)
 *   - Pass { refresh: true } with an explicit topic → skip already-covered gate (Regenerate flow)
 * Returns: PackagedArticle + optional selectedTopic when auto-picked
 */
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { requireAnthropicApiKey } = await import("@/lib/pipeline/llm");
    try {
      requireAnthropicApiKey();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ANTHROPIC_API_KEY is not configured";
      return NextResponse.json({ error: "Configuration error", detail: message }, { status: 503 });
    }

    let body: {
      topic?: TopicCandidate;
      auto?: boolean;
      refresh?: boolean;
      authorSlug?: string;
    } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const wantsAuto = body.auto === true || !body.topic?.title?.trim();
    const allowCoveredRefresh =
      body.refresh === true && !wantsAuto && Boolean(body.topic?.title?.trim());

    const { resolveGenerationTopic } = await import("@/lib/pipeline/radar");
    const resolved = await resolveGenerationTopic(wantsAuto ? null : body.topic, {
      allowCovered: allowCoveredRefresh,
    });

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
    const authorSlug =
      typeof body.authorSlug === "string" && body.authorSlug.trim()
        ? body.authorSlug.trim()
        : undefined;

    const { generateArticle } = await import("@/lib/pipeline/generate");
    const result = await generateArticle(topic, authorSlug ? { authorSlug } : undefined);
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
