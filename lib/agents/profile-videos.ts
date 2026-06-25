import { createClient } from "@supabase/supabase-js";
import type { Agent } from "@/lib/data/agents";
import type { AgentVideo } from "@/lib/data/agents";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/youtube";
import { resolveThumbnail } from "@/lib/playbook/embed";
import { enrichVideoThumbnails } from "@/lib/playbook/oembed";

export type AgentProfileVideo = {
  id: string;
  agentSlug: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  featuredInDisplayA: boolean;
  sortOrder: number;
};

export type AgentProfileVideoRow = {
  id: string;
  agent_slug: string;
  title: string;
  video_url: string;
  thumbnail: string;
  featured_in_display_a: boolean;
  sort_order: number;
};

export function rowToAgentProfileVideo(row: AgentProfileVideoRow): AgentProfileVideo {
  const videoUrl = row.video_url.trim();
  const thumbnail = resolveThumbnail(row.thumbnail, videoUrl);

  return {
    id: row.id,
    agentSlug: row.agent_slug,
    title: row.title.trim(),
    videoUrl,
    thumbnail,
    featuredInDisplayA: row.featured_in_display_a,
    sortOrder: row.sort_order,
  };
}

/** Static fallback when Supabase is unavailable or agent has no rows yet. */
export function staticAgentProfileVideos(agent: Agent): AgentProfileVideo[] {
  return (agent.featuredTikTokVideos ?? []).map((video, index) => ({
    id: video.id,
    agentSlug: agent.slug,
    title: `Property tip from ${agent.name.split(" ")[0]}`,
    videoUrl: video.url,
    thumbnail: "",
    featuredInDisplayA: true,
    sortOrder: index,
  }));
}

export async function getAgentProfileVideosServer(agentSlug: string): Promise<AgentProfileVideo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("agent_profile_videos")
    .select("*")
    .eq("agent_slug", agentSlug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("getAgentProfileVideosServer:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToAgentProfileVideo(row as AgentProfileVideoRow));
}

/** Load agent profile videos with TikTok/YouTube poster images resolved. */
export async function getAgentProfileVideosWithThumbnailsServer(
  agentSlug: string,
): Promise<AgentProfileVideo[]> {
  const videos = await getAgentProfileVideosServer(agentSlug);
  if (videos.length === 0) return videos;
  return enrichVideoThumbnails(videos);
}

export async function enrichStaticAgentProfileVideos(
  agent: Agent,
): Promise<AgentProfileVideo[]> {
  return enrichVideoThumbnails(staticAgentProfileVideos(agent));
}

/** YouTube channel clips when an agent has no TikTok / admin videos yet. */
export function youtubeVideosToProfileVideos(
  agent: Agent,
  videos: AgentVideo[],
): AgentProfileVideo[] {
  return videos.map((video, index) => ({
    id: video.id,
    agentSlug: agent.slug,
    title: video.title,
    videoUrl: youtubeWatchUrl(video.id),
    thumbnail: youtubeThumbnail(video.id),
    featuredInDisplayA: true,
    sortOrder: index,
  }));
}

/** Resolve the best available video list for an agent profile page. */
export async function resolveAgentProfileVideos(
  agent: Agent,
  dbVideos: AgentProfileVideo[],
  youtubeVideos: AgentVideo[],
): Promise<AgentProfileVideo[]> {
  if (dbVideos.length > 0) return dbVideos;

  const staticVideos = await enrichStaticAgentProfileVideos(agent);
  if (staticVideos.length > 0) return staticVideos;

  if (youtubeVideos.length > 0) {
    return enrichVideoThumbnails(youtubeVideosToProfileVideos(agent, youtubeVideos));
  }

  return [];
}

export function displayAVideos(videos: AgentProfileVideo[]): AgentProfileVideo[] {
  return videos.filter((video) => video.featuredInDisplayA);
}
