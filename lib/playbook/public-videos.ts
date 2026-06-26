import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";
import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import { isPlaybookVideo } from "@/lib/playbook/content-kind";
import type { AgentProfileVideo } from "@/lib/agents/profile-videos";

function videoKey(v: PlaybookVideo): string {
  return (v.videoUrl || "").trim().toLowerCase();
}

/** Agent profile video flagged for Display A — shown on the main Playbook rail too. */
export function agentProfileVideoToPlaybookVideo(video: AgentProfileVideo): PlaybookVideo {
  return {
    id: `agent-${video.id}`,
    slug: video.slug,
    title: video.title,
    description: video.title,
    category: "tips",
    duration: "",
    thumbnail: video.thumbnail,
    videoUrl: video.videoUrl,
    publishedAt: "2026-01-01",
    tags: [],
    topic: "condo_tips",
    contentKind: "video",
    displayA: video.featuredInDisplayA,
  };
}

/** Prefer DB metadata but keep sheet thumbnail when DB has none. */
function mergeVideoFields(sheet: PlaybookVideo, db: PlaybookVideo): PlaybookVideo {
  const dbThumb = db.thumbnail?.trim() ?? "";
  const sheetThumb = sheet.thumbnail?.trim() ?? "";
  return {
    ...db,
    thumbnail: dbThumb || sheetThumb,
    duration: db.duration?.trim() ? db.duration : sheet.duration,
    topic: db.topic ?? sheet.topic,
    displayA: db.displayA ?? sheet.displayA,
  };
}

/**
 * Sheet catalogue + admin DB videos + agent-profile videos.
 * Later sources win when the same URL exists in more than one — agent-profile
 * videos are the newest source of truth, so they take priority over both.
 */
export function mergePlaybookVideos(
  dbVideos: PlaybookVideo[],
  agentVideos: PlaybookVideo[] = [],
  sheetVideos: PlaybookVideo[] = PLAYBOOK_SHEET_VIDEOS,
): PlaybookVideo[] {
  const merged = new Map<string, PlaybookVideo>();

  for (const v of sheetVideos) {
    const key = videoKey(v);
    if (!key) continue;
    merged.set(key, v);
  }

  for (const v of dbVideos) {
    if (!isPlaybookVideo(v)) continue;
    const key = videoKey(v);
    if (!key) continue;
    const existing = merged.get(key);
    merged.set(key, existing ? mergeVideoFields(existing, v) : v);
  }

  for (const v of agentVideos) {
    const key = videoKey(v);
    if (!key) continue;
    const existing = merged.get(key);
    merged.set(key, existing ? mergeVideoFields(existing, v) : v);
  }

  return Array.from(merged.values());
}

export function groupPlaybookVideosByTopic(
  videos: PlaybookVideo[],
): Record<PlaybookTopic, PlaybookVideo[]> {
  const grouped: Record<PlaybookTopic, PlaybookVideo[]> = {
    upgraders: [],
    buying_first: [],
    condo_tips: [],
  };

  for (const video of videos) {
    if (video.topic) grouped[video.topic].push(video);
  }

  return grouped;
}

export function findPlaybookVideoBySlug(
  slug: string,
  videos: PlaybookVideo[],
): PlaybookVideo | undefined {
  return videos.find((v) => v.slug === slug);
}
