import type { Agent } from "@/lib/data/agents";
import { AGENTS, getAgentBySlug } from "@/lib/data/agents";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/youtube";

export const AGENT_INTRO_WATCH_SLUG_SUFFIX = "-intro";

export function agentIntroWatchSlug(agentSlug: string): string {
  return `${agentSlug}${AGENT_INTRO_WATCH_SLUG_SUFFIX}`;
}

export function parseAgentSlugFromIntroWatchSlug(slug: string): string | null {
  if (!slug.endsWith(AGENT_INTRO_WATCH_SLUG_SUFFIX)) return null;
  const agentSlug = slug.slice(0, -AGENT_INTRO_WATCH_SLUG_SUFFIX.length);
  return agentSlug || null;
}

export function agentIntroVideoToPlaybookVideo(agent: Agent): PlaybookVideo {
  const videoId = agent.introYoutubeVideoId!;
  const title = `Introduction from ${agent.name}`;

  return {
    id: `intro-${agent.slug}`,
    slug: agentIntroWatchSlug(agent.slug),
    title,
    description: agent.bio || title,
    category: "tips",
    duration: "",
    thumbnail: youtubeThumbnail(videoId),
    videoUrl: youtubeWatchUrl(videoId),
    publishedAt: "2026-01-01",
    tags: [],
    topic: "condo_tips",
    contentKind: "video",
    displayA: false,
  };
}

export function getAgentIntroVideoForWatchServer(slug: string): PlaybookVideo | null {
  const agentSlug = parseAgentSlugFromIntroWatchSlug(slug);
  if (!agentSlug) return null;

  const agent = getAgentBySlug(agentSlug);
  if (!agent?.introYoutubeVideoId) return null;

  return agentIntroVideoToPlaybookVideo(agent);
}

export function getAllAgentIntroWatchSlugs(): string[] {
  return AGENTS.filter((agent) => agent.introYoutubeVideoId).map((agent) =>
    agentIntroWatchSlug(agent.slug),
  );
}
