import type { Agent, AgentVideo } from "@/lib/data/agents";

const USER_AGENT =
  "Mozilla/5.0 (compatible; HomeUPBot/1.0; +https://homeup.sg)";

function parseLatestFromRss(xml: string): AgentVideo | null {
  const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const titleMatch = xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/);
  const publishedMatch = xml.match(/<entry>[\s\S]*?<published>([^<]+)<\/published>/);

  if (!videoIdMatch?.[1]) return null;

  return {
    id: videoIdMatch[1],
    title: titleMatch?.[1]?.replace(/^[^:]*:\s*/, "") ?? "Latest video",
    publishedAt: publishedMatch?.[1],
  };
}

async function resolveChannelId(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${handle}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/"channelId":"(UC[^"]+)"/) ??
      html.match(/"externalId":"(UC[^"]+)"/) ??
      html.match(/channel_id=(UC[^&"]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function fetchLatestFromChannelId(channelId: string): Promise<AgentVideo | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const xml = await res.text();
    return parseLatestFromRss(xml);
  } catch {
    return null;
  }
}

export async function getAgentYoutubeVideos(agent: Agent): Promise<AgentVideo[]> {
  const videos: AgentVideo[] = [];

  let channelId = agent.youtubeChannelId;
  if (!channelId && agent.youtubeChannelHandle) {
    channelId = (await resolveChannelId(agent.youtubeChannelHandle)) ?? undefined;
  }

  if (channelId) {
    const latest = await fetchLatestFromChannelId(channelId);
    if (latest) videos.push(latest);
  }

  const curated = agent.featuredVideos ?? [];
  for (const video of curated) {
    if (!videos.some((v) => v.id === video.id)) {
      videos.push(video);
    }
  }

  return videos.slice(0, 6);
}

export function youtubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    playsinline: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
