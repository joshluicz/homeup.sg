import { AGENTS } from "@/lib/data/agents";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { tiktokHandle, tiktokVideoId, youtubeId } from "@/lib/playbook/embed";

const DEFAULT_AGENT_SLUG = "dennis-lim";

const HANDLE_TO_AGENT = buildHandleToAgentMap();
const TIKTOK_ID_TO_AGENT = buildTikTokIdToAgentMap();
const NAME_HINTS = buildNameHints();

function buildHandleToAgentMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const agent of AGENTS) {
    const tiktok = agent.social?.tiktok;
    if (tiktok) {
      const handle = tiktokHandle(tiktok);
      if (handle) map.set(handle.toLowerCase(), agent.slug);
    }

    if (agent.youtubeChannelHandle) {
      map.set(agent.youtubeChannelHandle.toLowerCase(), agent.slug);
    }

    const youtube = agent.social?.youtube;
    if (youtube) {
      const match = youtube.match(/@([^/?#]+)/i);
      if (match?.[1]) map.set(match[1].toLowerCase(), agent.slug);
    }
  }

  return map;
}

function buildTikTokIdToAgentMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const agent of AGENTS) {
    for (const video of agent.featuredTikTokVideos ?? []) {
      map.set(video.id, agent.slug);
    }
  }

  return map;
}

function buildNameHints(): Array<{ slug: string; pattern: RegExp }> {
  return AGENTS.flatMap((agent) => {
    const first = agent.name.split(/\s+/)[0];
    return [
      { slug: agent.slug, pattern: new RegExp(agent.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { slug: agent.slug, pattern: new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i") },
    ];
  }).sort((a, b) => b.pattern.source.length - a.pattern.source.length);
}

function agentFromText(text: string): string | null {
  for (const hint of NAME_HINTS) {
    if (hint.pattern.test(text)) return hint.slug;
  }
  return null;
}

function agentFromVideoUrl(videoUrl?: string): string | null {
  if (!videoUrl?.trim()) return null;

  const ttHandle = tiktokHandle(videoUrl);
  if (ttHandle) {
    const byHandle = HANDLE_TO_AGENT.get(ttHandle.toLowerCase());
    if (byHandle) return byHandle;
  }

  const ttId = tiktokVideoId(videoUrl);
  if (ttId) {
    const byId = TIKTOK_ID_TO_AGENT.get(ttId);
    if (byId) return byId;
  }

  const lower = videoUrl.toLowerCase();
  for (const [handle, slug] of HANDLE_TO_AGENT.entries()) {
    if (lower.includes(`@${handle}`) || lower.includes(handle)) return slug;
  }

  if (youtubeId(videoUrl)) {
    return DEFAULT_AGENT_SLUG;
  }

  return null;
}

type AttributableItem = Pick<
  PlaybookVideo,
  "videoUrl" | "title" | "description" | "article" | "tags"
> & { agentSlug?: string | null };

const AGENT_SLUGS = new Set(AGENTS.map((agent) => agent.slug));

/** Explicit author override, when set in the admin panel and valid, wins over inference. */
export function inferPlaybookAgentSlug(item: AttributableItem): string {
  if (item.agentSlug && AGENT_SLUGS.has(item.agentSlug)) return item.agentSlug;

  const fromUrl = agentFromVideoUrl(item.videoUrl);
  if (fromUrl) return fromUrl;

  const haystack = [
    item.title,
    item.description,
    item.article?.slice(0, 800) ?? "",
    item.tags.join(" "),
  ].join(" ");

  return agentFromText(haystack) ?? DEFAULT_AGENT_SLUG;
}

export function getPlaybookAgentOptions(): Array<{ slug: string; name: string }> {
  return AGENTS.map((agent) => ({ slug: agent.slug, name: agent.name }));
}

export function getPlaybookAgentName(item: AttributableItem): string {
  const slug = inferPlaybookAgentSlug(item);
  return AGENTS.find((agent) => agent.slug === slug)?.name ?? "HomeUP";
}
