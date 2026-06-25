import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import sheetRows from "@/lib/data/playbook-sheet-videos.json";

type SheetRow = {
  title: string;
  url: string;
  tag1: string;
  tag2: string;
  topic: PlaybookTopic;
  thumbnail?: string;
  displayA?: boolean;
};

/** Curated YouTube / TikTok shorts from Dennis's content sheet (synced via scripts/sync-playbook-sheet-videos.mjs). */
const SHEET_ROWS = (sheetRows as SheetRow[]).map((row) => ({
  ...row,
  title: row.title.replace(/,\s*$/, "").trim(),
  tag1: row.tag1.trim(),
  tag2: row.tag2.trim(),
}));

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function videoIdFromUrl(url: string): string {
  const yt = url.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]+)/);
  if (yt?.[1]) return yt[1].slice(0, 16);
  const tt = url.match(/video\/(\d+)/);
  if (tt?.[1]) return tt[1].slice(-12);
  return "";
}

function uniqueSlug(title: string, url: string, used: Set<string>): string {
  let base = slugify(title);
  if (!base || base === "skit") {
    const id = videoIdFromUrl(url);
    base = id ? `video-${id}` : base || "video";
  }
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  used.add(slug);
  return slug;
}

function inferCategory(tag1: string, tag2: string): PlaybookVideo["category"] {
  const tags = `${tag1} ${tag2}`.toLowerCase();
  if (tags.includes("hdb") && tags.includes("news")) return "market";
  if (tags.includes("news") || tags.includes("en bloc")) return "market";
  if (tags.includes("hdb")) return "selling";
  if (tags.includes("condo") || tags.includes("landed")) return "tips";
  if (tags.includes("live") || tags.includes("new launch")) return "buying";
  return "tips";
}

function buildTags(tag1: string, tag2: string): string[] {
  return [tag1, tag2].map((t) => t.trim()).filter(Boolean);
}

export function buildSheetPlaybookVideos(): PlaybookVideo[] {
  const usedSlugs = new Set<string>();
  return SHEET_ROWS.map((row, index) => ({
    id: `sheet-${index + 1}`,
    slug: uniqueSlug(row.title, row.url, usedSlugs),
    title: row.title,
    description: row.title,
    category: inferCategory(row.tag1, row.tag2),
    duration: "",
    thumbnail: row.thumbnail?.trim() ?? "",
    videoUrl: row.url,
    publishedAt: "2026-01-01",
    tags: buildTags(row.tag1, row.tag2),
    topic: row.topic,
    displayA: row.displayA === true,
    contentKind: "video" as const,
  }));
}

export const PLAYBOOK_SHEET_VIDEOS = buildSheetPlaybookVideos();

export function getSheetVideoBySlug(slug: string): PlaybookVideo | undefined {
  return PLAYBOOK_SHEET_VIDEOS.find((v) => v.slug === slug);
}

export function getSheetVideosByTopic(topic: PlaybookTopic): PlaybookVideo[] {
  return PLAYBOOK_SHEET_VIDEOS.filter((v) => v.topic === topic);
}

export function getSheetDisplayAVideos(): PlaybookVideo[] {
  return PLAYBOOK_SHEET_VIDEOS.filter((v) => v.displayA === true);
}
