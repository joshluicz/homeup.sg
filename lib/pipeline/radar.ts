import { RADAR_TOPICS, RADAR_WEIGHTS } from "./radarConfig";
import type { TopicCandidate } from "./types";

/**
 * Returns scored topic candidates sorted by relevance.
 * Currently uses the curated list + composite scoring.
 * Future: plug in a Google Trends / SerpAPI call here.
 */
export async function runRadar(): Promise<TopicCandidate[]> {
  const scored: TopicCandidate[] = RADAR_TOPICS.map((t) => {
    const demandScore = RADAR_WEIGHTS.demand[t.demand] * 80;
    const evergreenBonus = t.evergreen ? RADAR_WEIGHTS.evergreen * 100 : 0;
    const score = Math.round(demandScore + evergreenBonus);

    return {
      ...t,
      score,
      source: "radar" as const,
    };
  });

  // Sort highest score first
  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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
