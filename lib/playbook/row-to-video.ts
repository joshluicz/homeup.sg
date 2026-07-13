import type { FaqEntry, PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import type { ArticleSections } from "@/lib/playbook/article-sections";

const ARTICLE_SECTIONS_VERSION = 1;

/** Lightweight guard — avoids importing article-sections (DOMPurify) for row mapping. */
function isArticleSections(value: unknown): value is ArticleSections {
  if (!value || typeof value !== "object") return false;
  const v = value as ArticleSections;
  return (
    v.version === ARTICLE_SECTIONS_VERSION &&
    typeof v.quickAnswer === "string" &&
    typeof v.introduction === "string" &&
    Array.isArray(v.sections) &&
    typeof v.homeup === "string" &&
    typeof v.conclusion === "string"
  );
}

/** Map a Supabase playbook_videos row to PlaybookVideo — no next/headers or DOMPurify deps. */
export function rowToVideo(row: Record<string, unknown>): PlaybookVideo {
  const rawSections = row.article_sections;
  const articleSections = isArticleSections(rawSections) ? rawSections : null;

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as PlaybookVideo["category"],
    duration: row.duration as string,
    thumbnail: row.thumbnail as string,
    videoUrl: row.video_url as string,
    featured: row.featured as boolean,
    publishedAt: row.published_at as string,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    article: (row.article as string) ?? "",
    articleSections,
    faq: ((row.faq as FaqEntry[]) ?? []).filter((f) => f?.q && f?.a),
    metaDescription: (row.meta_description as string) ?? "",
    topic: (row.topic as PlaybookTopic | null) ?? null,
    contentKind: (row.content_kind as PlaybookVideo["contentKind"]) ?? undefined,
    agentSlug: (row.agent_slug as string | null) ?? null,
  };
}
