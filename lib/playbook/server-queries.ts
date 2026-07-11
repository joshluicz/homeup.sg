import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import {
  PLAYBOOK_TOPICS,
  inferPlaybookTopicFromCategory,
} from "@/lib/data/playbook";
import { rowToVideo } from "@/lib/playbook/queries";
import { isPlaybookArticle, isPlaybookVideo } from "@/lib/playbook/content-kind";
import {
  findPlaybookVideoBySlug,
  groupPlaybookVideosByTopic,
  mergePlaybookVideos,
} from "@/lib/playbook/public-videos";
import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";
import {
  getAllAgentIntroWatchSlugs,
  getAgentIntroVideoForWatchServer,
} from "@/lib/agents/intro-videos";
import {
  getAgentProfileVideoBySlugServer,
  getAllAgentProfileVideoSlugsServer,
} from "@/lib/agents/profile-videos";
import { agentProfileVideoToPlaybookVideo } from "@/lib/playbook/public-videos";
import {
  getPlaybookArticleFromJson,
} from "@/lib/playbook/json-fallback";
import {
  getPublishedPlaybookArticlesServer,
  type PlaybookPublishedArticleRef,
} from "@/lib/playbook/published-articles";

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

async function fetchPlaybookRows() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { data: null, error: null };

  const supabase = createClient(url, key);
  return supabase.from("playbook_videos").select("*").order("published_at", { ascending: false });
}

/** Fetch merged sheet + DB videos grouped by journey section. */
export async function getPlaybookVideosByTopicServer(): Promise<
  Record<PlaybookTopic, PlaybookVideo[]>
> {
  const { data, error } = await fetchPlaybookRows();
  if (error) {
    console.warn("getPlaybookVideosByTopicServer:", error.message);
    return groupPlaybookVideosByTopic(PLAYBOOK_SHEET_VIDEOS);
  }

  const dbVideos = (data ?? []).map(rowToVideo);
  return groupPlaybookVideosByTopic(mergePlaybookVideos(dbVideos));
}

/** Resolve a watch-page video from admin DB entries, the synced sheet catalogue,
 *  and agent profile videos (Display A/B) — in that order. */
export async function getPlaybookVideoForWatchServer(
  slug: string,
): Promise<PlaybookVideo | null> {
  const introVideo = getAgentIntroVideoForWatchServer(slug);
  if (introVideo?.videoUrl?.trim()) return introVideo;

  const { data, error } = await fetchPlaybookRows();
  const dbVideos = error || !data ? [] : data.map(rowToVideo);
  const merged = mergePlaybookVideos(dbVideos);
  const video = findPlaybookVideoBySlug(slug, merged);
  if (video?.videoUrl?.trim()) return video;

  const agentVideo = await getAgentProfileVideoBySlugServer(slug);
  if (agentVideo?.videoUrl?.trim()) return agentProfileVideoToPlaybookVideo(agentVideo);

  return null;
}

export async function getAllWatchSlugsServer(): Promise<string[]> {
  const sheetSlugs = PLAYBOOK_SHEET_VIDEOS.map((v) => v.slug);
  const { data, error } = await fetchPlaybookRows();
  const dbSlugs =
    error || !data
      ? []
      : data
          .map(rowToVideo)
          .filter((v) => isPlaybookVideo(v) && v.videoUrl?.trim())
          .map((v) => v.slug);

  const agentSlugs = await getAllAgentProfileVideoSlugsServer();
  const introSlugs = getAllAgentIntroWatchSlugs();

  return [...new Set([...sheetSlugs, ...dbSlugs, ...agentSlugs, ...introSlugs])];
}

export type WatchPageSitemapEntry = {
  slug: string;
  updatedAt: string | null;
};

/** All shareable watch pages for sitemap.xml (playbook, agent profile, and intro videos). */
export async function getWatchPageSitemapEntries(): Promise<WatchPageSitemapEntry[]> {
  const slugs = await getAllWatchSlugsServer();
  return slugs.map((slug) => ({ slug, updatedAt: null }));
}

function filterPublishedPlaybookArticleRows(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.filter((row) => {
    const entry = rowToVideo(row);
    return isPlaybookArticle(entry) && Boolean(entry.article?.trim());
  });
}

export { getPublishedPlaybookArticlesServer, type PlaybookPublishedArticleRef };

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

  return filterPublishedPlaybookArticleRows(data ?? []).map((row) => row.slug as string);
}

export {
  getPlaybookArticleSitemapEntries,
  type PlaybookArticleSitemapEntry,
} from "@/lib/playbook/sitemap-entries";

async function fetchPlaybookVideoBySlug(slug: string): Promise<PlaybookVideo | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from("playbook_videos")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        const video = rowToVideo(data);
        if (isPlaybookArticle(video) && video.article?.trim()) return video;
      }
    } catch (error) {
      console.warn("fetchPlaybookVideoBySlug Supabase:", error);
    }
  }

  return getPlaybookArticleFromJson(slug);
}

/** Cached per request so generateMetadata + page share one Supabase round-trip. */
export const getPlaybookVideoBySlugServer = cache(fetchPlaybookVideoBySlug);
