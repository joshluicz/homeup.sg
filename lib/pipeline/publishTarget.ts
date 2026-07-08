import { createClient } from "@supabase/supabase-js";
import type { PackagedArticle } from "./types";

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
