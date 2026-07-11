import { requireAuth } from "@/lib/supabase/auth";
import { getPublishedArticles } from "@/lib/pipeline/publishTarget";
import { NextResponse } from "next/server";

/** GET /api/admin/published-articles — slug + title catalog for dedup / coverage UI */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const articles = await getPublishedArticles();
  return NextResponse.json(
    articles.map(({ slug, title }) => ({ slug, title })),
  );
}
