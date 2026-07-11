import { requireAuth } from "@/lib/supabase/auth";
import { getPublishedArticles } from "@/lib/pipeline/publishTarget";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/published-articles — slug + title catalog for dedup / coverage UI */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const articles = await getPublishedArticles();
    return NextResponse.json(
      articles.map(({ slug, title }) => ({ slug, title })),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load published articles";
    console.error("[published-articles]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
