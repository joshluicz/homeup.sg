import { requireAuth } from "@/lib/supabase/auth";
import { revalidatePlaybookPaths } from "@/lib/playbook/revalidate-playbook";
import { NextResponse } from "next/server";
import type { PackagedArticle } from "@/lib/pipeline/types";

const VALID_TOPICS = ["upgraders", "buying_first", "condo_tips"] as const;
type PlaybookTopic = (typeof VALID_TOPICS)[number];

/**
 * POST /api/admin/publish
 * Body: { article: PackagedArticle, topic: "upgraders" | "buying_first" | "condo_tips" }
 * Returns: { slug, id }
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let article: PackagedArticle;
  let topic: PlaybookTopic;

  try {
    const body = await request.json();
    article = body.article;
    topic = body.topic;
    if (!article?.draft?.title) throw new Error("article.draft.title missing");
    if (!VALID_TOPICS.includes(topic)) throw new Error("Invalid topic");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (article.compliance?.passed !== true) {
    return NextResponse.json(
      {
        error: "COMPLIANCE_FAILED",
        detail: "Article failed compliance review and cannot be published.",
        issues: article.compliance?.issues ?? [],
        warnings: article.compliance?.warnings ?? [],
      },
      { status: 422 },
    );
  }

  try {
    const { publishArticle } = await import("@/lib/pipeline/publishTarget");
    const { slug, id } = await publishArticle(article, topic);

    // Warm ISR cache for the new article
    revalidatePlaybookPaths([slug]);

    return NextResponse.json({ slug, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Publish failed", detail: message }, { status: 500 });
  }
}
