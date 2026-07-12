import { createClient } from "@supabase/supabase-js";
import { getAllPlaybookArticlesFromJson } from "@/lib/playbook/json-fallback";

export type PlaybookPublishedArticleRef = {
  slug: string;
  title: string;
  article?: string;
};

/** Same filter as the public /playbook page — article with content in either field. */
export function filterPublishedPlaybookArticleRows(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.filter((row) => {
    const contentKind = (row.content_kind as string | null) ?? null;
    if (contentKind === "video") return false;
    const hasArticle = Boolean((row.article as string | null)?.trim());
    const hasSections = row.article_sections != null;
    return hasArticle || hasSections;
  });
}

function mergePublishedArticlesWithJson(
  dbRows: PlaybookPublishedArticleRef[],
): PlaybookPublishedArticleRef[] {
  const bySlug = new Map<string, PlaybookPublishedArticleRef>();
  for (const row of dbRows) bySlug.set(row.slug, row);
  for (const jsonRow of getAllPlaybookArticlesFromJson()) {
    if (!bySlug.has(jsonRow.slug)) {
      bySlug.set(jsonRow.slug, {
        slug: jsonRow.slug,
        title: jsonRow.title,
        article: jsonRow.article,
      });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
}

async function fetchPlaybookRowsForPublishedArticles() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[published-articles] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return { data: null, error: null };
  }

  const supabase = createClient(url, key);
  return supabase.from("playbook_videos").select("*").order("published_at", { ascending: false });
}

/** Published playbook articles — anon Supabase read + article filter + JSON fallback. */
export async function getPublishedPlaybookArticlesServer(): Promise<PlaybookPublishedArticleRef[]> {
  const { data, error } = await fetchPlaybookRowsForPublishedArticles();
  if (error) {
    console.warn("getPublishedPlaybookArticlesServer:", error.message);
    return mergePublishedArticlesWithJson([]);
  }

  const dbRows = filterPublishedPlaybookArticleRows(data ?? []).map((row) => ({
    slug: row.slug as string,
    title: row.title as string,
    article: (row.article as string | null)?.trim() || undefined,
  }));

  return mergePublishedArticlesWithJson(dbRows);
}
