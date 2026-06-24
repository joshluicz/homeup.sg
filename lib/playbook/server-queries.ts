import { createClient } from "@supabase/supabase-js";
import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import {
  PLAYBOOK_TOPICS,
  inferPlaybookTopicFromCategory,
} from "@/lib/data/playbook";
import { rowToVideo } from "@/lib/playbook/queries";
import { isPlaybookArticle } from "@/lib/playbook/content-kind";

function resolveTopic(row: Record<string, unknown>): PlaybookTopic {
  const topic = row.topic as PlaybookTopic | null;
  if (topic && PLAYBOOK_TOPICS.includes(topic)) return topic;
  return inferPlaybookTopicFromCategory(row.category as PlaybookVideo["category"]);
}

function emptyArticlesByTopic(): Record<PlaybookTopic, PlaybookVideo[]> {
  return { upgraders: [], buying_first: [], condo_tips: [] };
}

/** Fetch playbook articles grouped by journey section (server/build time). */
export async function getPlaybookArticlesByTopicServer(): Promise<
  Record<PlaybookTopic, PlaybookVideo[]>
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return emptyArticlesByTopic();

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.warn("getPlaybookArticlesByTopicServer:", error.message);
    return emptyArticlesByTopic();
  }

  const articles = emptyArticlesByTopic();
  for (const row of data ?? []) {
    const entry = rowToVideo(row);
    if (!isPlaybookArticle(entry) || !entry.article?.trim()) continue;
    const topic = resolveTopic(row);
    articles[topic].push({ ...entry, topic });
  }
  return articles;
}

/** Server/build-time Supabase queries (no cookies). Used by generateStaticParams and the
 *  static-rendered /playbook/[slug] article pages. Mirrors lib/listings/server-queries.ts. */
export async function getAllPlaybookSlugs(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("slug, article, video_url");

  if (error) {
    console.warn("getAllPlaybookSlugs:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => {
      const entry = rowToVideo(row);
      return isPlaybookArticle(entry) && Boolean(entry.article?.trim());
    })
    .map((row) => row.slug as string);
}

export async function getPlaybookVideoBySlugServer(
  slug: string,
): Promise<PlaybookVideo | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  const video = rowToVideo(data);
  if (!isPlaybookArticle(video) || !video.article?.trim()) return null;
  return video;
}
