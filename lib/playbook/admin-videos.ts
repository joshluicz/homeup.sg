import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { isPlaybookArticle, isPlaybookVideo } from "@/lib/playbook/content-kind";

export const SHEET_VIDEO_ID_PREFIX = "sheet:";

export type AdminPlaybookVideoRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: PlaybookVideo["category"];
  duration: string;
  thumbnail: string;
  video_url: string;
  featured: boolean;
  published_at: string;
  tags: string[];
  article?: string;
  faq?: { q: string; a: string }[];
  meta_description?: string;
  topic?: PlaybookVideo["topic"];
  /** Present on catalogue rows not yet stored in Supabase. */
  sheetCatalogue?: boolean;
};

function videoUrlKey(url: string): string {
  return url.trim().toLowerCase();
}

export function isSheetCatalogueAdminId(id: string): boolean {
  return id.startsWith(SHEET_VIDEO_ID_PREFIX);
}

function sheetVideoToAdminRow(video: PlaybookVideo): AdminPlaybookVideoRow {
  return {
    id: `${SHEET_VIDEO_ID_PREFIX}${video.slug}`,
    slug: video.slug,
    title: video.title,
    description: video.description,
    category: video.category,
    duration: video.duration,
    thumbnail: video.thumbnail,
    video_url: video.videoUrl,
    featured: Boolean(video.featured),
    published_at: video.publishedAt,
    tags: video.tags,
    article: "",
    topic: video.topic ?? undefined,
    sheetCatalogue: true,
  };
}

/** DB playbook rows plus sheet catalogue videos missing from Supabase (same merge as /playbook). */
export function mergeAdminPlaybookVideos(
  dbRows: AdminPlaybookVideoRow[],
  mode: "article" | "video",
): AdminPlaybookVideoRow[] {
  if (mode === "article") {
    return dbRows.filter((row) =>
      isPlaybookArticle({ article: row.article, videoUrl: row.video_url }),
    );
  }

  const scopedDb = dbRows
    .filter((row) => isPlaybookVideo({ article: row.article, videoUrl: row.video_url }))
    .map((row) => {
      const sheet = PLAYBOOK_SHEET_VIDEOS.find(
        (video) => videoUrlKey(video.videoUrl) === videoUrlKey(row.video_url),
      );
      if (!row.thumbnail?.trim() && sheet?.thumbnail?.trim()) {
        return { ...row, thumbnail: sheet.thumbnail.trim() };
      }
      return row;
    });

  const dbVideoUrls = new Set(
    scopedDb.map((row) => row.video_url).filter(Boolean).map(videoUrlKey),
  );

  const catalogueRows = PLAYBOOK_SHEET_VIDEOS.filter((video) => {
    const key = videoUrlKey(video.videoUrl);
    return key && !dbVideoUrls.has(key);
  }).map(sheetVideoToAdminRow);

  return [...scopedDb, ...catalogueRows].sort((a, b) =>
    b.published_at.localeCompare(a.published_at),
  );
}
