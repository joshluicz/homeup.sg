import { draftPrompt } from "./prompt";
import {
  assertDraftLength,
  extractTextContent,
  getAnthropicClient,
  getLlmModel,
  parseModelJson,
} from "./llm";
import type { Brief, Draft } from "./types";

interface DraftJson {
  title?: string;
  description?: string;
  metaDescription?: string;
  article?: string;
  faq?: { q: string; a: string }[];
}

/**
 * Calls Claude to write the full article draft from a brief.
 * Throws on API failure, JSON parse failure, or body shorter than MIN_DRAFT_WORDS.
 */
export async function draftArticle(
  brief: Brief,
  transactionStats?: string | null,
  slugHint?: string,
): Promise<Draft> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: getLlmModel(),
    max_tokens: 8192,
    messages: [{ role: "user", content: draftPrompt(brief, transactionStats, slugHint) }],
  });

  const raw = extractTextContent(message);
  if (!raw) {
    throw new Error(
      `draft generation returned no text content (stop_reason=${message.stop_reason ?? "unknown"})`,
    );
  }

  const parsed = parseModelJson<DraftJson>(raw, "draft generation failed");
  const article = typeof parsed.article === "string" ? parsed.article.trim() : "";

  assertDraftLength(article, message.stop_reason);

  return {
    brief,
    title: parsed.title ?? brief.seoTitle,
    description: parsed.description ?? "",
    metaDescription: parsed.metaDescription ?? "",
    article,
    faq: Array.isArray(parsed.faq)
      ? parsed.faq.filter((f): f is { q: string; a: string } => !!f?.q && !!f?.a)
      : [],
  };
}
