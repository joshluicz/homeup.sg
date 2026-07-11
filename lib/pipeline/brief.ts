import { getAgentBySlug } from "@/lib/data/agents";
import { BRAND } from "./brand";
import { extractTextContent, getAnthropicClient, getLlmModel, stripJsonFences } from "./llm";
import { briefPrompt } from "./prompt";
import type { Brief, TopicCandidate } from "./types";

export interface BriefOptions {
  authorSlug?: string;
}

/** Routes a topic to the most relevant author by expertise match. */
function assignAuthor(topic: TopicCandidate): (typeof BRAND.authors)[number] {
  for (const author of BRAND.authors) {
    if (author.expertise.includes(topic.category as never)) return author;
  }
  // Default to first author
  return BRAND.authors[0];
}

function resolveAuthor(
  topic: TopicCandidate,
  authorSlug?: string,
): Pick<Brief, "authorSlug" | "authorName" | "authorCea"> {
  if (authorSlug) {
    const agent = getAgentBySlug(authorSlug);
    if (agent) {
      return { authorSlug: agent.slug, authorName: agent.name, authorCea: agent.cea };
    }
  }

  const brandAuthor = assignAuthor(topic);
  const agent = getAgentBySlug(brandAuthor.slug);
  return {
    authorSlug: brandAuthor.slug,
    authorName: brandAuthor.name,
    authorCea: agent?.cea ?? "",
  };
}

/** Calls Claude to generate a structured article brief for the given topic. */
export async function generateBrief(topic: TopicCandidate, opts?: BriefOptions): Promise<Brief> {
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

  const author = resolveAuthor(topic, opts?.authorSlug);

  return {
    topic,
    seoTitle: parsed.seoTitle ?? topic.title,
    h2Questions: parsed.h2Questions ?? [],
    primaryKeywords: parsed.primaryKeywords ?? topic.tags,
    secondaryKeywords: parsed.secondaryKeywords ?? [],
    ...author,
    targetWordCount: parsed.targetWordCount ?? 550,
  };
}
