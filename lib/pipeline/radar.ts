import { RADAR_TOPICS, RADAR_WEIGHTS } from "./radarConfig";
import {
  getPublishedArticles,
  isTopicAlreadyPublished,
} from "./publishTarget";
import type { TopicCandidate } from "./types";

/**
 * Returns scored topic candidates sorted by relevance.
 * Marks topics that match a live /playbook article as alreadyPublished.
 */
export async function runRadar(): Promise<TopicCandidate[]> {
  const published = await getPublishedArticles();

  const scored: TopicCandidate[] = RADAR_TOPICS.map((t) => {
    const demandScore = RADAR_WEIGHTS.demand[t.demand] * 80;
    const evergreenBonus = t.evergreen ? RADAR_WEIGHTS.evergreen * 100 : 0;
    const score = Math.round(demandScore + evergreenBonus);

    return {
      ...t,
      score,
      source: "radar" as const,
      alreadyPublished: isTopicAlreadyPublished(t.title, published, t.id),
    };
  });

  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/** Highest-scored radar topic that is not already published. */
export function pickTopUnpublishedTopic(topics: TopicCandidate[]): TopicCandidate | null {
  const pick = topics.find((t) => !t.alreadyPublished);
  if (pick) return pick;

  console.warn(
    `[radar] All ${topics.length} radar topics matched published articles — auto-pick unavailable.`,
  );
  return null;
}

/** Resolve which topic to generate: explicit pick, or top unpublished from radar. */
export async function resolveGenerationTopic(
  explicit?: TopicCandidate | null,
): Promise<{ topic: TopicCandidate; autoSelected: boolean } | null> {
  if (explicit?.title?.trim()) {
    return { topic: explicit, autoSelected: false };
  }

  const topics = await runRadar();
  const topic = pickTopUnpublishedTopic(topics);
  if (!topic) return null;
  return { topic, autoSelected: true };
}

/** Creates a custom topic candidate from user input. */
export function makeCustomTopic(title: string): TopicCandidate {
  return {
    id: `custom-${Date.now()}`,
    title: title.trim(),
    searchIntent: `User-defined topic: ${title.trim()}`,
    category: "hdb_upgrade",
    demand: "medium",
    evergreen: true,
    tags: [],
    score: 60,
    source: "custom",
  };
}
