import { createClient } from "@/lib/supabase/server";
import type { FaqEntry, PlaybookVideo, PlaybookTopic } from "@/lib/data/playbook";

export function rowToVideo(row: Record<string, unknown>): PlaybookVideo {
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
    tags: row.tags as string[],
    article: (row.article as string) ?? "",
    faq: ((row.faq as FaqEntry[]) ?? []).filter((f) => f?.q && f?.a),
    metaDescription: (row.meta_description as string) ?? "",
    topic: (row.topic as PlaybookVideo["topic"]) ?? null,
  };
}

export async function getPlaybookVideos(): Promise<PlaybookVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToVideo);
}

export async function getPlaybookVideoBySlug(slug: string): Promise<PlaybookVideo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return rowToVideo(data);
}
