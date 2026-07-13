import { requireAuth } from "@/lib/supabase/auth";
import { matchTopicAgainstCatalog } from "@/lib/pipeline/dedup";
import { runRadar, makeCustomTopic } from "@/lib/pipeline/radar";
import { getPublishedPlaybookArticlesServer } from "@/lib/playbook/published-articles";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/topics — returns scored radar topic candidates */
export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const topics = await runRadar();
    return NextResponse.json(topics);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load topics";
    console.error("[topics GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/admin/topics — converts a custom user title into a topic candidate */
export async function POST(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { title } = await request.json();
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const topic = makeCustomTopic(title);
    const published = await getPublishedPlaybookArticlesServer();
    const match = matchTopicAgainstCatalog(topic.title, published, topic.id);
    topic.alreadyPublished = match.covered;
    topic.matchedArticle = match.matchedArticle;
    return NextResponse.json(topic);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create topic";
    console.error("[topics POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
