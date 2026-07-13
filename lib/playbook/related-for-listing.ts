import {
  PLAYBOOK_TOPICS,
  type PlaybookTopic,
  type PlaybookVideo,
} from "@/lib/data/playbook";
import type { FlatType, ListedAs } from "@/lib/listings/types";
import { hasPlaybookArticleContent } from "@/lib/playbook/content-kind";
import { getAllPlaybookVideosFromJson } from "@/lib/playbook/json-fallback";
import { getPlaybookArticlesByTopicServer } from "@/lib/playbook/server-queries";

const FLAT_TYPE_TAG_HINTS: Record<FlatType, string[]> = {
  hdb: ["hdb"],
  condominium: ["condo", "private property"],
  apartment: ["condo", "private property", "apartment"],
  landed: ["landed"],
};

function scorePlaybookItem(
  video: PlaybookVideo,
  flat_type: FlatType,
  listed_as: ListedAs,
): number {
  let score = 0;
  const preferredCategories =
    listed_as === "sell"
      ? new Set(["selling", "process", "tips"])
      : new Set(["buying", "tips", "process"]);

  if (preferredCategories.has(video.category)) score += 2;

  const tagsLower = video.tags.map((t) => t.toLowerCase());
  for (const hint of FLAT_TYPE_TAG_HINTS[flat_type]) {
    if (tagsLower.some((t) => t.includes(hint))) score += 3;
  }
  if (listed_as === "sell" && tagsLower.some((t) => t.includes("sell"))) score += 1;
  if (listed_as === "rent" && tagsLower.some((t) => t.includes("buy"))) score += 1;

  return score;
}

/** Live Playbook articles related to a listing — never placeholder slugs without content. */
export async function getRelatedPlaybookArticlesForListingServer(opts: {
  flat_type: FlatType;
  listed_as: ListedAs;
  limit?: number;
}): Promise<PlaybookVideo[]> {
  const { flat_type, listed_as, limit = 3 } = opts;
  const articlesByTopic = await getPlaybookArticlesByTopicServer();
  const bySlug = new Map<string, PlaybookVideo>();
  for (const topic of PLAYBOOK_TOPICS) {
    for (const video of articlesByTopic[topic]) {
      if (hasPlaybookArticleContent(video)) bySlug.set(video.slug, video);
    }
  }
  for (const video of getAllPlaybookVideosFromJson()) {
    if (hasPlaybookArticleContent(video) && !bySlug.has(video.slug)) {
      bySlug.set(video.slug, video);
    }
  }
  const articles = [...bySlug.values()];

  const scored = articles
    .map((video) => ({ video, score: scorePlaybookItem(video, flat_type, listed_as) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, limit).map(({ video }) => video);
  }

  const fallbackTopic: PlaybookTopic = listed_as === "sell" ? "upgraders" : "buying_first";
  const topicFallback = articlesByTopic[fallbackTopic].filter(hasPlaybookArticleContent);
  if (topicFallback.length > 0) return topicFallback.slice(0, limit);

  return articles.slice(0, limit);
}
