import type { PlaybookVideo } from "@/lib/data/playbook";
import { articleHasDesignedThumbnail } from "@/lib/playbook/article-thumbnails";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function eligibleArticles(articles: PlaybookVideo[]): PlaybookVideo[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (!a.slug || !a.article?.trim() || seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });
}

/** Pick up to 5 articles for the rotating featured carousel (topic-scoped). */
export function pickFeaturedArticles(articles: PlaybookVideo[], limit = 5): PlaybookVideo[] {
  return eligibleArticles(articles)
    .sort((a, b) => {
      const aDesigned = articleHasDesignedThumbnail(a);
      const bDesigned = articleHasDesignedThumbnail(b);
      if (aDesigned !== bDesigned) return aDesigned ? -1 : 1;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    })
    .slice(0, limit);
}

/** Random featured picks across all categories for the playbook blog hero. */
export function pickRandomFeaturedArticles(articles: PlaybookVideo[], limit = 5): PlaybookVideo[] {
  const pool = eligibleArticles(articles);
  if (pool.length <= limit) return pool;
  return shuffle(pool).slice(0, limit);
}
