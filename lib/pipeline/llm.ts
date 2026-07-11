import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

/** Minimum article body length — shorter output is treated as a failed draft. */
export const MIN_DRAFT_WORDS = 200;

const PLACEHOLDER_KEYS = new Set(["", "your-anthropic-api-key", "paste_anthropic_key_here"]);

/** Default Claude model for the article pipeline (override via HOMEUP_LLM_MODEL). */
export function getLlmModel(): string {
  return process.env.HOMEUP_LLM_MODEL?.trim() || "claude-sonnet-5";
}

/** Returns the Anthropic API key or throws with an operator-facing message. */
export function requireAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key.toLowerCase())) {
    throw new Error(
      "Server missing ANTHROPIC_API_KEY — add it to .env.local (local dev) or Vercel Environment Variables (production), then restart/redeploy.",
    );
  }
  return key;
}

export function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: requireAnthropicApiKey() });
}

export function extractTextContent(message: Message): string {
  const parts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

export function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Parses model JSON output; throws with a short preview on failure. */
export function parseModelJson<T>(raw: string, context: string): T {
  const cleaned = stripJsonFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    const preview = cleaned.slice(0, 240).replace(/\s+/g, " ");
    const parseMsg = err instanceof Error ? err.message : "parse error";
    throw new Error(
      `${context}: model returned invalid JSON (${parseMsg}). Preview: "${preview}${cleaned.length > 240 ? "…" : ""}"`,
    );
  }
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Throws when draft body is empty or below MIN_DRAFT_WORDS. */
export function assertDraftLength(
  article: string,
  stopReason: string | null,
  extra?: string,
): void {
  const words = countWords(article);
  if (words >= MIN_DRAFT_WORDS) return;

  const suffix = [
    stopReason ? `stop_reason=${stopReason}` : null,
    extra ?? null,
    `word_count=${words}`,
  ]
    .filter(Boolean)
    .join(", ");

  throw new Error(`draft generation returned empty/short output (${suffix})`);
}
