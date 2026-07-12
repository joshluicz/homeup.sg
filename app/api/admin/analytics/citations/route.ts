/**
 * GET  /api/admin/analytics/citations          — latest citation summary per slug
 * POST /api/admin/analytics/citations { slug } — run citation check for one article
 *
 * Both routes are admin-gated via requireAuth().
 * Feature is cleanly disabled (200 with configured: false) when
 * PERPLEXITY_API_KEY is not set.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isAiCitationsConfigured,
  checkArticleCitations,
  getCitationSummaries,
} from "@/lib/analytics/aiCitations";
import { getPublishedArticles } from "@/lib/pipeline/publishTarget";
import { NextResponse } from "next/server";

// Citation checks involve multiple sequential Perplexity calls
export const maxDuration = 90;

/** GET — returns cached citation summaries for all published articles */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isAiCitationsConfigured()) {
    return NextResponse.json({ configured: false, summaries: [] });
  }

  // All live /playbook article slugs — same public read path as the site.
  const slugs = (await getPublishedArticles()).map((a) => a.slug);
  const summaries = await getCitationSummaries(slugs);

  return NextResponse.json({ configured: true, summaries });
}

/**
 * POST { slug } — fetch the article from DB, extract questions,
 * run Perplexity checks, persist, return full result.
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isAiCitationsConfigured()) {
    return NextResponse.json(
      {
        error: "CITATIONS_NOT_CONFIGURED",
        detail: "Set PERPLEXITY_API_KEY to enable AI citation tracking.",
      },
      { status: 503 },
    );
  }

  let slug: string;
  try {
    const body = await request.json() as { slug?: string };
    slug = (body.slug ?? "").trim();
    if (!slug) throw new Error("slug required");
  } catch {
    return NextResponse.json({ error: "Request body must be { slug: string }" }, { status: 400 });
  }

  // Fetch the article from DB
  const supabase = createServiceClient();
  const { data: article, error: dbErr } = await supabase
    .from("playbook_videos")
    .select("slug, article, faq")
    .eq("slug", slug)
    .maybeSingle();

  if (dbErr || !article) {
    return NextResponse.json({ error: "Article not found", slug }, { status: 404 });
  }

  try {
    const result = await checkArticleCitations(article as { slug: string; faq?: { q: string; a: string }[] | null; article?: string | null });

    if (!result) {
      return NextResponse.json(
        { error: "No questions found in article to check." },
        { status: 422 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Citation check failed", detail: msg }, { status: 500 });
  }
}
