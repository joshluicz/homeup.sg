import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaybookTopic } from "@/lib/data/playbook";
import type { ArticleSections } from "@/lib/playbook/article-sections";

export type PlaybookContentKind = "article" | "video";

export type PlaybookVideoWriteInput = {
  slug?: string;
  title: string;
  description?: string;
  category: string;
  topic: PlaybookTopic;
  duration?: string;
  thumbnail?: string;
  videoUrl?: string;
  featured?: boolean;
  publishedAt?: string;
  tags?: string[];
  article?: string;
  articleSections?: ArticleSections | null;
  faq?: { q: string; a: string }[];
  metaDescription?: string;
  agentSlug?: string | null;
  contentKind: PlaybookContentKind;
};

const MISSING_COLUMN_RE =
  /Could not find the '([^']+)' column of 'playbook_videos' in the schema cache/i;

function columnFromSchemaError(message: string): string | null {
  const match = message.match(MISSING_COLUMN_RE);
  return match?.[1] ?? null;
}

/** Build a Supabase row payload — never writes content_kind (inferred from article vs video_url). */
export function buildPlaybookVideoDbPayload(
  input: PlaybookVideoWriteInput,
  opts?: { slugify?: (title: string) => string },
): Record<string, unknown> {
  const slugify = opts?.slugify ?? defaultSlugify;
  const contentKind = input.contentKind === "video" ? "video" : "article";

  return {
    slug: input.slug?.trim() || slugify(input.title),
    title: input.title,
    description: input.description ?? "",
    category: input.category,
    duration: contentKind === "video" ? (input.duration ?? "") : "",
    thumbnail: input.thumbnail ?? "",
    video_url: contentKind === "video" ? (input.videoUrl ?? "") : "",
    featured: input.featured ?? false,
    published_at: input.publishedAt ?? new Date().toISOString().slice(0, 10),
    tags: input.tags ?? [],
    article: contentKind === "article" ? (input.article ?? "") : "",
    article_sections: contentKind === "article" ? (input.articleSections ?? null) : null,
    faq: contentKind === "article" ? (input.faq ?? []) : [],
    meta_description: contentKind === "article" ? (input.metaDescription ?? "") : "",
    topic: input.topic ?? null,
    agent_slug: input.agentSlug || null,
    updated_at: new Date().toISOString(),
  };
}

function defaultSlugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

type WriteResult =
  | { data: Record<string, unknown>; error: null }
  | { data: null; error: { message: string; code?: string } };

/**
 * Insert or update playbook_videos, stripping optional columns the DB may not have yet
 * (e.g. content_kind when migrations were not applied).
 */
export async function writePlaybookVideoRow(
  supabase: SupabaseClient,
  opts: { id?: string; payload: Record<string, unknown> },
): Promise<WriteResult> {
  const stripped = new Set<string>();

  for (let attempt = 0; attempt < 10; attempt++) {
    const body = Object.fromEntries(
      Object.entries(opts.payload).filter(([key]) => !stripped.has(key)),
    );

    const result = opts.id
      ? await supabase.from("playbook_videos").update(body).eq("id", opts.id).select().single()
      : await supabase.from("playbook_videos").insert(body).select().single();

    if (!result.error && result.data) {
      return { data: result.data as Record<string, unknown>, error: null };
    }

    if (!result.error) {
      return { data: null, error: { message: "Save returned no row." } };
    }

    const missingColumn = columnFromSchemaError(result.error.message);
    if (missingColumn && !stripped.has(missingColumn)) {
      stripped.add(missingColumn);
      continue;
    }

    return { data: null, error: result.error };
  }

  return {
    data: null,
    error: { message: "Could not save playbook entry after removing unsupported columns." },
  };
}
