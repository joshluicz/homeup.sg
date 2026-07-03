import finalTenArticles from "@/lib/data/playbook-final-10-articles.json";

/** Build-time fallback slugs when Supabase is unavailable during `next build`. */
export function getKnownPlaybookArticleSlugs(): string[] {
  const slugs = finalTenArticles
    .map((entry) => entry.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  return [...new Set(slugs)];
}
