import Anthropic from "@anthropic-ai/sdk";
import { BRAND } from "./brand";
import { briefPrompt } from "./prompt";
import type { Brief, TopicCandidate } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: briefPrompt(topic) }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

  let parsed: {
    seoTitle?: string;
    h2Questions?: string[];
    primaryKeywords?: string[];
    secondaryKeywords?: string[];
    targetWordCount?: number;
  };

  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
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
