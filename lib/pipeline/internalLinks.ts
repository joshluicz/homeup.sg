/**
 * Phase 4 — Internal linking (pillar → cluster).
 *
 * Given the new article's title + body and the list of existing Playbook articles,
 * asks Claude to pick 3–5 genuinely relevant ones and returns anchor-text suggestions.
 * The module appends a "Related guides:" section to the article body — safe for the
 * existing plain-text renderer without requiring parser changes.
 *
 * Returns the article unchanged if the DB is empty, Claude fails, or no relevant
 * articles are found — always degrades gracefully.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InternalLink {
  slug: string;
  title: string;
}

// ── Fetch existing articles from DB ──────────────────────────────────────────

async function fetchExistingArticles(
  excludeSlug?: string,
): Promise<{ slug: string; title: string }[]> {
  try {
    const supabase = createServiceClient();
    const q = supabase
      .from("playbook_videos")
      .select("slug, title")
      .neq("article", "")
      .order("published_at", { ascending: false })
      .limit(60); // cap to keep the prompt reasonable

    const { data } = excludeSlug
      ? await q.neq("slug", excludeSlug)
      : await q;

    return (data ?? []).map((r: { slug: string; title: string }) => ({
      slug: r.slug,
      title: r.title,
    }));
  } catch {
    return [];
  }
}

// ── Claude call ───────────────────────────────────────────────────────────────

async function selectRelevantLinks(
  newTitle: string,
  newArticleExcerpt: string,
  candidates: { slug: string; title: string }[],
): Promise<InternalLink[]> {
  if (candidates.length === 0) return [];

  const candidateList = candidates
    .map((c, i) => `${i + 1}. ${c.title} (/playbook/${c.slug})`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are building internal links for a Singapore property content site.

NEW ARTICLE: "${newTitle}"
EXCERPT: ${newArticleExcerpt.slice(0, 600)}

EXISTING ARTICLES (candidates):
${candidateList}

Pick 3–5 articles that are GENUINELY relevant to a reader of the new article — topics they would naturally want to read next. Exclude any that cover the same ground.

Return valid JSON only (no markdown fences):
[{"slug": "...", "title": "..."}]

Return an empty array [] if fewer than 3 genuinely relevant articles exist.`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as {
      slug?: string;
      title?: string;
    }[];
    // Validate: only return slugs that exist in candidates
    const validSlugs = new Set(candidates.map((c) => c.slug));
    return parsed
      .filter((l): l is InternalLink => Boolean(l.slug && l.title && validSlugs.has(l.slug)))
      .slice(0, 5);
  } catch {
    return [];
  }
}

// ── Append links section ──────────────────────────────────────────────────────

function appendLinksSection(article: string, links: InternalLink[]): string {
  if (links.length === 0) return article;

  const section = [
    "",
    "Related guides:",
    "",
    ...links.map((l) => `• [${l.title}](/playbook/${l.slug})`),
  ].join("\n");

  return article.trimEnd() + section;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Selects 3–5 relevant internal links for the article and appends a
 * "Related guides:" section. Returns the original article on any failure.
 */
export async function addInternalLinks(
  article: string,
  title: string,
  currentSlug?: string,
): Promise<{ article: string; links: InternalLink[] }> {
  try {
    const candidates = await fetchExistingArticles(currentSlug);
    if (candidates.length < 3) return { article, links: [] };

    const links = await selectRelevantLinks(title, article, candidates);
    return { article: appendLinksSection(article, links), links };
  } catch {
    return { article, links: [] };
  }
}
