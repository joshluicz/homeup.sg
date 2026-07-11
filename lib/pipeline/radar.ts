import { matchTopicAgainstCatalog } from "./dedup";
import { RADAR_TOPICS, RADAR_WEIGHTS } from "./radarConfig";
import { getPublishedArticles, type PublishedArticleRef } from "./publishTarget";
import type { TopicCandidate } from "./types";

export type GenerationTopicResolution =
  | { status: "ok"; topic: TopicCandidate; autoSelected: boolean }
  | { status: "all_covered" }
  | { status: "topic_covered"; matchedArticle: PublishedArticleRef };

function applyCoverage(
  topic: TopicCandidate,
  published: PublishedArticleRef[],
): TopicCandidate {
  const match = matchTopicAgainstCatalog(topic.title, published, topic.id);
  return {
    ...topic,
    alreadyPublished: match.covered,
    matchedArticle: match.matchedArticle,
  };
}

/** Score radar seeds and mark topics already covered on /playbook. */
export function scoreRadarTopics(published: PublishedArticleRef[]): TopicCandidate[] {
  const scored: TopicCandidate[] = RADAR_TOPICS.map((t) => {
    const demandScore = RADAR_WEIGHTS.demand[t.demand] * 80;
    const evergreenBonus = t.evergreen ? RADAR_WEIGHTS.evergreen * 100 : 0;
    const score = Math.round(demandScore + evergreenBonus);

    return applyCoverage(
      {
        ...t,
        score,
        source: "radar" as const,
      },
      published,
    );
  });

  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Returns scored topic candidates sorted by relevance.
 * Marks topics that semantically match a live /playbook article as alreadyPublished.
 */
export async function runRadar(): Promise<TopicCandidate[]> {
  const published = await getPublishedArticles();
  return scoreRadarTopics(published);
}

const AUTO_PICK_POOL_SIZE = 5;

/** Random pick among the top N highest-scored uncovered radar topics. */
export function pickTopUnpublishedTopic(topics: TopicCandidate[]): TopicCandidate | null {
  const pool = topics.filter((t) => !t.alreadyPublished).slice(0, AUTO_PICK_POOL_SIZE);
  if (pool.length === 0) {
    console.warn(
      `[radar] All ${topics.length} radar topics match articles on /playbook — auto-pick unavailable.`,
    );
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

/** Resolve which topic to generate: explicit pick, or top unpublished from radar. */
export async function resolveGenerationTopic(
  explicit?: TopicCandidate | null,
  options?: { allowCovered?: boolean },
): Promise<GenerationTopicResolution> {
  const published = await getPublishedArticles();

  if (explicit?.title?.trim()) {
    if (!options?.allowCovered) {
      const match = matchTopicAgainstCatalog(explicit.title, published, explicit.id);
      if (match.covered && match.matchedArticle) {
        return { status: "topic_covered", matchedArticle: match.matchedArticle };
      }
    }
    return { status: "ok", topic: explicit, autoSelected: false };
  }

  const topics = scoreRadarTopics(published);
  const topic = pickTopUnpublishedTopic(topics);
  if (!topic) return { status: "all_covered" };
  return { status: "ok", topic, autoSelected: true };
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
