import Anthropic from "@anthropic-ai/sdk";
import { draftPrompt } from "./prompt";
import type { Brief, Draft } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Calls Claude to write the full article draft from a brief. */
export async function draftArticle(brief: Brief): Promise<Draft> {
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: draftPrompt(brief) }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

  let parsed: {
    title?: string;
    description?: string;
    metaDescription?: string;
    article?: string;
    faq?: { q: string; a: string }[];
  };

  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = {};
  }

  return {
    brief,
    title: parsed.title ?? brief.seoTitle,
    description: parsed.description ?? "",
    metaDescription: parsed.metaDescription ?? "",
    article: parsed.article ?? "",
    faq: Array.isArray(parsed.faq)
      ? parsed.faq.filter((f): f is { q: string; a: string } => !!f?.q && !!f?.a)
      : [],
  };
}
