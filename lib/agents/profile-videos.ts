import { createClient } from "@supabase/supabase-js";
import type { Agent } from "@/lib/data/agents";
import type { AgentVideo } from "@/lib/data/agents";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/youtube";
import { resolveThumbnail } from "@/lib/playbook/embed";
import { enrichVideoThumbnails } from "@/lib/playbook/oembed";
import { slugify, uniqueSlug } from "@/lib/playbook/slugify";

export type AgentProfileVideo = {
  id: string;
  agentSlug: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  featuredInDisplayA: boolean;
  featuredInDisplayB: boolean;
  sortOrder: number;
  /** Powers the shareable /playbook/watch/[slug] page for this video. */
  slug: string;
};

export type AgentProfileVideoRow = {
  id: string;
  agent_slug: string;
  title: string;
  video_url: string;
  thumbnail: string;
  featured_in_display_a: boolean;
  featured_in_display_b: boolean;
  sort_order: number;
  slug: string | null;
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
    featuredInDisplayB: row.featured_in_display_b,
    sortOrder: row.sort_order,
    slug: row.slug?.trim() || `agent-${row.id}`,
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
    featuredInDisplayB: true,
    sortOrder: index,
    slug: `agent-${video.id}`,
  }));
}

/** Look up a single agent profile video by its shareable slug. */
export async function getAgentProfileVideoBySlugServer(
  slug: string,
): Promise<AgentProfileVideo | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);

  // Try slug column first.
  const { data, error } = await supabase
    .from("agent_profile_videos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!error && data) return rowToAgentProfileVideo(data as AgentProfileVideoRow);

  // Fallback: videos with slug=null use "agent-{id}" as their display slug.
  const idMatch = slug.match(/^agent-(.+)$/);
  if (idMatch) {
    const { data: byId, error: idErr } = await supabase
      .from("agent_profile_videos")
      .select("*")
      .eq("id", idMatch[1])
      .maybeSingle();
    if (!idErr && byId) return rowToAgentProfileVideo(byId as AgentProfileVideoRow);
  }

  return null;
}

/** All agent profile video slugs, for static generation of watch pages. */
export async function getAllAgentProfileVideoSlugsServer(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("agent_profile_videos").select("slug");
  if (error || !data) return [];

  return data.map((row) => (row.slug as string | null)?.trim()).filter((s): s is string => !!s);
}

/** Slugify a title for a new agent profile video, avoiding collisions with `taken`. */
export function slugifyAgentVideoTitle(title: string, taken: Set<string>): string {
  return uniqueSlug(slugify(title) || "video", taken);
}

/** Videos shown on the agent's own profile page (Display B) — opt-in per video. */
export async function getAgentProfileVideosServer(agentSlug: string): Promise<AgentProfileVideo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("agent_profile_videos")
    .select("*")
    .eq("agent_slug", agentSlug)
    .eq("featured_in_display_b", true)
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
    featuredInDisplayB: true,
    sortOrder: index,
    slug: `agent-${video.id}`,
  }));
}

/** Resolve the best available video list for an agent profile page.
 *  The admin panel (DB) is the single source of truth — no fallbacks. */
export async function resolveAgentProfileVideos(
  agent: Agent,
  dbVideos: AgentProfileVideo[],
  _youtubeVideos: AgentVideo[],
): Promise<AgentProfileVideo[]> {
  return dbVideos;
}

export function displayAVideos(videos: AgentProfileVideo[]): AgentProfileVideo[] {
  return videos.filter((video) => video.featuredInDisplayA);
}
