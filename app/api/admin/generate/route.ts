import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import type { Brief, Draft, PackagedArticle, TopicCandidate } from "@/lib/pipeline/types";

// Each phase runs at most one heavy Claude call — 120s per step avoids gateway timeouts.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

type GeneratePhase = "brief" | "draft" | "package" | "enrich";

/** Lightweight health probe — must not import pipeline/LLM modules at load time. */
export async function GET() {
  return NextResponse.json({ ok: true, route: "admin/generate" });
}

type GenerateBody = {
  phase?: GeneratePhase;
  topic?: TopicCandidate;
  brief?: Brief;
  draft?: Draft;
  packaged?: PackagedArticle;
  transactionStats?: string | null;
  slugHint?: string;
  auto?: boolean;
  refresh?: boolean;
  authorSlug?: string;
};

async function resolveTopic(body: GenerateBody) {
  const wantsAuto = body.auto === true || !body.topic?.title?.trim();
  const allowCoveredRefresh =
    body.refresh === true && !wantsAuto && Boolean(body.topic?.title?.trim());

  const { resolveGenerationTopic } = await import("@/lib/pipeline/radar");
  return resolveGenerationTopic(wantsAuto ? null : body.topic, {
    allowCovered: allowCoveredRefresh,
  });
}

/**
 * POST /api/admin/generate
 * Body (phased — preferred from admin UI):
 *   { phase: "brief", topic?, auto?, refresh?, authorSlug? }
 *   { phase: "draft", brief, transactionStats?, slugHint }
 *   { phase: "package", draft, slugHint }
 *   { phase: "enrich", packaged, slugHint }
 * Body (legacy single-shot): { topic?, auto?, refresh?, authorSlug? }
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

    let body: GenerateBody = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const phase = body.phase;
    const authorSlug =
      typeof body.authorSlug === "string" && body.authorSlug.trim()
        ? body.authorSlug.trim()
        : undefined;

    const {
      runBriefPhase,
      runDraftPhase,
      runPackagePhase,
      runEnrichPhase,
      generateArticle,
    } = await import("@/lib/pipeline/generate");

    if (phase === "draft") {
      if (!body.brief?.topic?.title?.trim()) {
        return NextResponse.json({ error: "Missing brief for draft phase" }, { status: 400 });
      }
      const slugHint =
        typeof body.slugHint === "string" && body.slugHint.trim()
          ? body.slugHint.trim()
          : body.brief.topic.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-")
              .slice(0, 80);
      const result = await runDraftPhase(
        body.brief,
        body.transactionStats ?? null,
        slugHint,
      );
      return NextResponse.json(result);
    }

    if (phase === "package") {
      if (!body.draft?.brief?.topic?.title?.trim() || !body.draft.article?.trim()) {
        return NextResponse.json({ error: "Missing draft for package phase" }, { status: 400 });
      }
      const slugHint =
        typeof body.slugHint === "string" && body.slugHint.trim()
          ? body.slugHint.trim()
          : body.draft.brief.topic.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-")
              .slice(0, 80);
      const result = await runPackagePhase(body.draft, slugHint);
      return NextResponse.json(result);
    }

    if (phase === "enrich") {
      if (!body.packaged?.draft?.article?.trim()) {
        return NextResponse.json({ error: "Missing packaged article for enrich phase" }, { status: 400 });
      }
      const slugHint =
        typeof body.slugHint === "string" && body.slugHint.trim()
          ? body.slugHint.trim()
          : body.packaged.suggestedSlug;
      const result = await runEnrichPhase(body.packaged, slugHint);
      return NextResponse.json(result);
    }

    const resolved = await resolveTopic(body);

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

    if (phase === "brief") {
      const result = await runBriefPhase(topic, authorSlug ? { authorSlug } : undefined);
      return NextResponse.json({
        ...result,
        ...(autoSelected ? { selectedTopic: topic } : {}),
      });
    }

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
