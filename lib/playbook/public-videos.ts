import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";
import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import { isPlaybookVideo } from "@/lib/playbook/content-kind";

function videoKey(v: PlaybookVideo): string {
  return (v.videoUrl || "").trim().toLowerCase();
}

/** Sheet catalogue + admin DB videos (DB wins when the same URL exists in both). */
export function mergePlaybookVideos(
  dbVideos: PlaybookVideo[],
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
    merged.set(key, v);
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
