import type { PlaybookVideo } from "@/lib/data/playbook";
import { articleHasDesignedThumbnail } from "@/lib/playbook/article-thumbnails";

/** Pick up to 5 articles for the rotating featured carousel. */
export function pickFeaturedArticles(articles: PlaybookVideo[], limit = 5): PlaybookVideo[] {
  const seen = new Set<string>();

  return articles
    .filter((a) => a.slug && a.article?.trim())
    .filter((a) => {
      if (seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    })
    .sort((a, b) => {
      const aDesigned = articleHasDesignedThumbnail(a);
      const bDesigned = articleHasDesignedThumbnail(b);
      if (aDesigned !== bDesigned) return aDesigned ? -1 : 1;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    })
    .slice(0, limit);
}
