import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import { PLAYBOOK_TOPICS } from "@/lib/data/playbook";
import { inferPlaybookAgentSlug } from "@/lib/playbook/agent-attribution";

export type PlaybookTopicFilter = PlaybookTopic | "all";
export type PlaybookAgentFilter = "all" | string;

export type PlaybookJourneyFilters = {
  topic: PlaybookTopicFilter;
  query: string;
  agent: PlaybookAgentFilter;
};

export const DEFAULT_PLAYBOOK_JOURNEY_FILTERS: PlaybookJourneyFilters = {
  topic: "all",
  query: "",
  agent: "all",
};

function emptyByTopic(): Record<PlaybookTopic, PlaybookVideo[]> {
  return { upgraders: [], buying_first: [], condo_tips: [] };
}

function matchesSearch(item: PlaybookVideo, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    item.title,
    item.description,
    item.slug,
    item.metaDescription ?? "",
    item.tags.join(" "),
    item.article ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function filterPlaybookItem(
  item: PlaybookVideo,
  filters: PlaybookJourneyFilters,
): boolean {
  if (filters.topic !== "all" && item.topic !== filters.topic) return false;
  if (filters.agent !== "all" && inferPlaybookAgentSlug(item) !== filters.agent) return false;
  if (!matchesSearch(item, filters.query)) return false;
  return true;
}

export function filterPlaybookByTopic(
  grouped: Record<PlaybookTopic, PlaybookVideo[]>,
  filters: PlaybookJourneyFilters,
): Record<PlaybookTopic, PlaybookVideo[]> {
  const result = emptyByTopic();

  for (const topic of PLAYBOOK_TOPICS) {
    if (filters.topic !== "all" && topic !== filters.topic) continue;
    result[topic] = grouped[topic].filter((item) => filterPlaybookItem(item, filters));
  }

  return result;
}

export function flattenPlaybookArticles(
  grouped: Record<PlaybookTopic, PlaybookVideo[]>,
  filters: PlaybookJourneyFilters,
): PlaybookVideo[] {
  const filtered = filterPlaybookByTopic(grouped, filters);
  return PLAYBOOK_TOPICS.flatMap((topic) => filtered[topic]).filter(
    (item) => item.slug && item.article?.trim(),
  );
}

export function flattenPlaybookVideos(
  grouped: Record<PlaybookTopic, PlaybookVideo[]>,
): PlaybookVideo[] {
  return PLAYBOOK_TOPICS.flatMap((topic) => grouped[topic]).filter((item) =>
    Boolean(item.videoUrl?.trim()),
  );
}

/** Display A rail — sheet-flagged videos, optionally filtered by topic/search. */
export function filterDisplayAVideos(
  videos: PlaybookVideo[],
  filters: PlaybookJourneyFilters,
): PlaybookVideo[] {
  return videos
    .filter((item) => item.displayA === true && item.videoUrl?.trim())
    .filter((item) => filterPlaybookItem(item, filters));
}

export function countPlaybookMatches(
  videosByTopic: Record<PlaybookTopic, PlaybookVideo[]>,
  articlesByTopic: Record<PlaybookTopic, PlaybookVideo[]>,
  filters: PlaybookJourneyFilters,
): number {
  const videos = flattenPlaybookVideos(videosByTopic);
  const articles = flattenPlaybookArticles(articlesByTopic, filters);
  return videos.length + articles.length;
}

export function hasActivePlaybookFilters(filters: PlaybookJourneyFilters): boolean {
  return (
    filters.topic !== "all" ||
    filters.agent !== "all" ||
    Boolean(filters.query.trim())
  );
}
