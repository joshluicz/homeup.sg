/**
 * Write path only — inserts generated articles into playbook_videos.
 *
 * Do NOT import this module from catalog/list API routes (published-articles, GSC, etc.).
 * Top-level imports include article-sections → isomorphic-dompurify, which crashes some
 * serverless route bundles at module load. Reads belong in lib/playbook/published-articles.ts.
 */
import {
  articleSectionsFromMarkdownArticle,
  normalizeArticleSections,
  serializeArticleSectionsToMarkdown,
} from "@/lib/playbook/article-sections";
import {
  buildPlaybookVideoDbPayload,
  writePlaybookVideoRow,
} from "@/lib/playbook/playbook-db-write";
import { createClient } from "@supabase/supabase-js";
import type { PackagedArticle } from "./types";

export type { PublishedArticleRef } from "@/lib/playbook/published-articles";

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

  const payload = buildPlaybookVideoDbPayload(
    {
      slug,
      title: draft.title,
      description: draft.description,
      category: "tips",
      topic,
      thumbnail: draft.thumbnail ?? "",
      videoUrl: "",
      featured: false,
      publishedAt: new Date().toISOString().slice(0, 10),
      tags: article.tags,
      article: serializedArticle,
      articleSections,
      faq: draft.faq,
      metaDescription: draft.metaDescription,
      agentSlug: draft.brief.authorSlug,
      contentKind: "article",
    },
    { slugify: () => slug },
  );

  const { data, error } = await writePlaybookVideoRow(supabase, { payload });

  if (error || !data) throw new Error(error?.message ?? "Publish failed");

  return { slug: data.slug as string, id: data.id as string };
}
