import { createClient } from "@supabase/supabase-js";
import { isPlaybookArticle } from "@/lib/playbook/content-kind";

export type PlaybookArticleSitemapEntry = {
  slug: string;
  updatedAt: string | null;
};

function isPublishedArticleRow(row: Record<string, unknown>): boolean {
  return isPlaybookArticle({
    article: (row.article as string) ?? "",
    videoUrl: (row.video_url as string) ?? "",
  });
}

/** Lightweight sitemap helper — avoids server-queries → article-sections → jsdom chain. */
export async function getPlaybookArticleSitemapEntries(): Promise<PlaybookArticleSitemapEntry[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("slug, article, video_url, updated_at");

  if (error) {
    console.warn("getPlaybookArticleSitemapEntries:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => isPublishedArticleRow(row))
    .map((row) => ({
      slug: row.slug as string,
      updatedAt: (row.updated_at as string | null) ?? null,
    }));
}
