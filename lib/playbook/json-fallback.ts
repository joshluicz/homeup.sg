import type { FaqEntry, PlaybookVideo } from "@/lib/data/playbook";
import finalTenArticles from "@/lib/data/playbook-final-10-articles.json";

type JsonArticleEntry = {
  slug: string;
  title: string;
  description?: string;
  meta_description?: string;
  thumbnail?: string;
  topic?: PlaybookVideo["topic"];
  category?: PlaybookVideo["category"];
  featured?: boolean;
  article?: string;
  faq?: FaqEntry[];
  tags?: string[];
  content_kind?: PlaybookVideo["contentKind"];
};

function jsonEntryToVideo(entry: JsonArticleEntry): PlaybookVideo {
  return {
    id: `json-${entry.slug}`,
    slug: entry.slug,
    title: entry.title,
    description: entry.description ?? "",
    category: entry.category ?? "tips",
    duration: "",
    thumbnail: entry.thumbnail ?? "",
    videoUrl: "",
    featured: entry.featured ?? false,
    publishedAt: "",
    tags: entry.tags ?? [],
    article: entry.article ?? "",
    faq: (entry.faq ?? []).filter((f) => f?.q && f?.a),
    metaDescription: entry.meta_description ?? entry.description ?? "",
    topic: entry.topic ?? null,
    contentKind: entry.content_kind ?? "article",
    agentSlug: null,
  };
}

/** Build-time / runtime fallback when Supabase is slow or unavailable. */
export function getPlaybookArticleFromJson(slug: string): PlaybookVideo | null {
  const entry = (finalTenArticles as JsonArticleEntry[]).find((row) => row.slug === slug);
  if (!entry?.article?.trim()) return null;
  return jsonEntryToVideo(entry);
}

export function getAllPlaybookArticleSlugsFromJson(): string[] {
  return (finalTenArticles as JsonArticleEntry[])
    .filter((row) => Boolean(row.article?.trim()))
    .map((row) => row.slug)
    .filter(Boolean);
}
