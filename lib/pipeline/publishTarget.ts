import {
  articleSectionsFromMarkdownArticle,
  normalizeArticleSections,
  serializeArticleSectionsToMarkdown,
} from "@/lib/playbook/article-sections";
import { getPublishedPlaybookArticlesServer } from "@/lib/playbook/server-queries";
import { createClient } from "@supabase/supabase-js";
import type { PackagedArticle } from "./types";

export interface PublishedArticleRef {
  slug: string;
  title: string;
  article?: string;
}

/**
 * All live /playbook articles — same anon read path as the public site, plus JSON fallback.
 * Used by the topic radar to skip duplicates.
 */
export async function getPublishedArticles(): Promise<PublishedArticleRef[]> {
  return getPublishedPlaybookArticlesServer();
}

/** Slugs of all published playbook articles (convenience wrapper). */
export async function getPublishedSlugs(): Promise<string[]> {
  const articles = await getPublishedArticles();
  return articles.map((a) => a.slug);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now()
  );
}

/**
 * ⚠️  THE ONE FILE you wire to the store.
 * Inserts the packaged article into playbook_videos via the service-role client
 * (bypasses RLS so it can write from server-side pipeline routes).
 * After a successful write, call /api/admin/playbook/revalidate to warm ISR.
 */
export async function publishArticle(
  article: PackagedArticle,
  topic: "upgraders" | "buying_first" | "condo_tips",
): Promise<{ slug: string; id: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { draft } = article;
  const slug = slugify(draft.title);
  const articleSections = normalizeArticleSections(
    articleSectionsFromMarkdownArticle(draft.article),
  );
  const serializedArticle = serializeArticleSectionsToMarkdown(articleSections);

  const payload = {
    slug,
    title: draft.title,
    description: draft.description,
    article: serializedArticle,
    article_sections: articleSections,
    faq: draft.faq,
    meta_description: draft.metaDescription,
    tags: article.tags,
    topic,
    agent_slug: draft.brief.authorSlug,
    thumbnail: draft.thumbnail ?? "",
    video_url: "",
    featured: false,
    content_kind: "article",
    published_at: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("playbook_videos")
    .insert(payload)
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  return { slug: data.slug, id: data.id };
}
