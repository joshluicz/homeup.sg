import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import { PLAYBOOK_TOPICS } from "@/lib/data/playbook";
import { inferPlaybookAgentSlug } from "@/lib/playbook/agent-attribution";

export type PlaybookTopicFilter = PlaybookTopic | "all";
export type PlaybookAgentFilter = string | "all";

export type PlaybookJourneyFilters = {
  topic: PlaybookTopicFilter;
  agent: PlaybookAgentFilter;
  query: string;
};

export const DEFAULT_PLAYBOOK_JOURNEY_FILTERS: PlaybookJourneyFilters = {
  topic: "all",
  agent: "all",
  query: "",
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

export function countPlaybookMatches(
  videosByTopic: Record<PlaybookTopic, PlaybookVideo[]>,
  articlesByTopic: Record<PlaybookTopic, PlaybookVideo[]>,
  filters: PlaybookJourneyFilters,
): number {
  const videos = filterPlaybookByTopic(videosByTopic, filters);
  const articles = filterPlaybookByTopic(articlesByTopic, filters);
  return (
    PLAYBOOK_TOPICS.reduce((sum, topic) => sum + videos[topic].length + articles[topic].length, 0)
  );
}

export function hasActivePlaybookFilters(filters: PlaybookJourneyFilters): boolean {
  return (
    filters.topic !== "all" ||
    filters.agent !== "all" ||
    Boolean(filters.query.trim())
  );
}
