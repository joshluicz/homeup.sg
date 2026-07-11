import type { PlaybookVideo } from "@/lib/data/playbook";
import { playbookVideoHref } from "@/lib/playbook/embed";

export type PlaybookContentKind = "article" | "video";

type PlaybookRow = Pick<PlaybookVideo, "article" | "videoUrl"> & {
  content_kind?: PlaybookContentKind | null;
  contentKind?: PlaybookContentKind | null;
};

export function resolvePlaybookContentKind(row: PlaybookRow): PlaybookContentKind {
  const explicit = row.content_kind ?? row.contentKind;
  const hasArticle = Boolean(row.article?.trim());
  const hasVideo = Boolean(row.videoUrl?.trim());

  if (explicit === "article") return "article";
  if (explicit === "video") return "video";

  // Legacy rows before content_kind: never treat both as one hybrid — article wins until split.
  if (hasArticle && hasVideo) return "article";
  if (hasVideo && !hasArticle) return "video";
  return "article";
}

export function isPlaybookArticle(row: PlaybookRow): boolean {
  return resolvePlaybookContentKind(row) === "article" && Boolean(row.article?.trim());
}

export function isPlaybookVideo(row: PlaybookRow): boolean {
  return resolvePlaybookContentKind(row) === "video" && Boolean(row.videoUrl?.trim());
}

/** Crawlable path for a playbook row — article page or on-site watch page. */
export function playbookItemPath(row: PlaybookRow & { slug: string }): string {
  if (isPlaybookVideo(row)) {
    return playbookVideoHref({ slug: row.slug, videoUrl: row.videoUrl }).href;
  }
  return `/playbook/${row.slug}`;
}

export function playbookItemCtaLabel(row: PlaybookRow): string {
  return isPlaybookVideo(row) ? "Watch in Playbook" : "Read in Playbook";
}
