import { BRAND } from "./brand";
import { extractTextContent, getAnthropicClient, getLlmModel, stripJsonFences } from "./llm";
import { briefPrompt } from "./prompt";
import type { Brief, TopicCandidate } from "./types";

/** Routes a topic to the most relevant author by expertise match. */
function assignAuthor(topic: TopicCandidate): (typeof BRAND.authors)[number] {
  for (const author of BRAND.authors) {
    if (author.expertise.includes(topic.category as never)) return author;
  }
  // Default to first author
  return BRAND.authors[0];
}

/** Calls Claude to generate a structured article brief for the given topic. */
export async function generateBrief(topic: TopicCandidate): Promise<Brief> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: getLlmModel(),
    max_tokens: 1024,
    messages: [{ role: "user", content: briefPrompt(topic) }],
  });

  const raw = extractTextContent(message);

  let parsed: {
    seoTitle?: string;
    h2Questions?: string[];
    primaryKeywords?: string[];
    secondaryKeywords?: string[];
    targetWordCount?: number;
  };

  try {
    parsed = raw ? JSON.parse(stripJsonFences(raw)) : {};
  } catch {
    parsed = {};
  }

  const author = assignAuthor(topic);

  return {
    topic,
    seoTitle: parsed.seoTitle ?? topic.title,
    h2Questions: parsed.h2Questions ?? [],
    primaryKeywords: parsed.primaryKeywords ?? topic.tags,
    secondaryKeywords: parsed.secondaryKeywords ?? [],
    authorSlug: author.slug,
    authorName: author.name,
    targetWordCount: parsed.targetWordCount ?? 550,
  };
}
