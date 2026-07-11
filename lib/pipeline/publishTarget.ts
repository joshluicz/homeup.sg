import { createClient } from "@supabase/supabase-js";
import type { PackagedArticle } from "./types";

export interface PublishedArticleRef {
  slug: string;
  title: string;
}

const DEDUP_STOPWORDS = new Set([
  "a", "an", "the", "to", "for", "in", "of", "and", "or", "your", "how", "when",
  "what", "is", "it", "do", "you", "can", "i", "my", "singapore", "guide", "2026",
]);

function slugifyForDedup(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Normalizes a slug or title for duplicate detection (case, suffixes, stopwords). */
export function normalizeSlugForDedup(raw: string): string {
  let s = slugifyForDedup(raw);
  s = s.replace(/-2026-guide$/, "");
  // publishArticle() appends a millisecond timestamp to slugs
  s = s.replace(/-\d{10,13}$/, "");
  const tokens = s.split("-").filter((t) => t && !DEDUP_STOPWORDS.has(t));
  return tokens.join("-");
}

function slugKeysMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  // Near-duplicate: high token overlap (same topic, slightly different title/slug)
  const overlap = tokenOverlapRatio(a, b);
  return overlap >= 0.85 && Math.min(a.length, b.length) >= 10;
}

function tokenOverlapRatio(a: string, b: string): number {
  const ta = a.split("-").filter(Boolean);
  const tb = b.split("-").filter(Boolean);
  if (!ta.length || !tb.length) return 0;
  const setB = new Set(tb);
  let inter = 0;
  for (const t of ta) if (setB.has(t)) inter++;
  return inter / Math.max(ta.length, tb.length);
}

/** True when a radar topic title overlaps a live /playbook article slug or title. */
export function isTopicAlreadyPublished(
  topicTitle: string,
  published: PublishedArticleRef[],
  topicId?: string,
): boolean {
  const topicKey = normalizeSlugForDedup(topicTitle);
  if (!topicKey) return false;

  const idKey = topicId ? normalizeSlugForDedup(topicId) : "";

  for (const { slug, title } of published) {
    const slugKey = normalizeSlugForDedup(slug);
    const titleKey = normalizeSlugForDedup(title);

    for (const pubKey of [slugKey, titleKey]) {
      if (slugKeysMatch(topicKey, pubKey)) return true;
    }

    // Radar topic id often matches the slug stem before publish timestamp
    if (idKey && (slugKey === idKey || slugKey.startsWith(`${idKey}-`))) return true;
  }
  return false;
}

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  }
  return createClient(supabaseUrl, serviceKey);
}

/**
 * All live /playbook articles that have body content — same source as GSC analytics.
 * Used by the topic radar to skip duplicates.
 */
export async function getPublishedArticles(): Promise<PublishedArticleRef[]> {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("playbook_videos")
      .select("slug, title, article")
      .not("article", "is", null)
      .neq("article", "");

    if (error) {
      console.error("[pipeline] getPublishedArticles failed:", error.message);
      return [];
    }

    return (data ?? [])
      .filter(
        (row) =>
          typeof row.slug === "string" &&
          row.slug.length > 0 &&
          typeof row.title === "string" &&
          row.title.length > 0 &&
          typeof row.article === "string" &&
          row.article.trim().length > 0,
      )
      .map(({ slug, title }) => ({ slug, title }));
  } catch (err) {
    console.error("[pipeline] getPublishedArticles error:", err);
    return [];
  }
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

  const payload = {
    slug,
    title: draft.title,
    description: draft.description,
    article: draft.article,
    faq: draft.faq,
    meta_description: draft.metaDescription,
    tags: article.tags,
    topic,
    agent_slug: draft.brief.authorSlug,
    thumbnail: draft.thumbnail ?? "",
    video_url: "",
    featured: false,
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
