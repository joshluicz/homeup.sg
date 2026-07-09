/**
 * Phase 3 — AI citation tracker.
 *
 * For each article's FAQ questions + H2 headings, queries Perplexity (online LLM)
 * and detects whether "homeup.sg" or "HomeUP" appears in the answer or citations.
 *
 * Required env var (server-only, optional):
 *   PERPLEXITY_API_KEY   — if absent the feature is cleanly disabled; no errors thrown.
 *
 * Pluggable: swap the provider by replacing `queryAnswerEngine()`.
 */

import { createServiceClient } from "@/lib/supabase/service";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CitationResult {
  question: string;
  cited: boolean;
  answerExcerpt: string;
}

export interface ArticleCitationScore {
  slug: string;
  citedCount: number;
  totalQuestions: number;
  /** 0.0 – 1.0 */
  score: number;
  checkedAt: string;
  results: CitationResult[];
}

export interface CitationSummary {
  slug: string;
  citedCount: number;
  totalQuestions: number;
  score: number;
  checkedAt: string | null;
}

// ── Perplexity client ─────────────────────────────────────────────────────────

const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

interface PerplexityResponse {
  choices?: { message?: { content?: string } }[];
  citations?: string[];
  error?: { message: string };
}

/**
 * Queries the configured answer engine with a plain question.
 * Returns { answer, citations } or null if unconfigured / request fails.
 * Currently wired to Perplexity; swap this function to add other providers.
 */
async function queryAnswerEngine(
  question: string,
): Promise<{ answer: string; citations: string[] } | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null; // feature disabled — clean no-op

  try {
    const resp = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant answering Singapore property questions. Be concise and factual.",
          },
          { role: "user", content: question },
        ],
        max_tokens: 512,
        return_citations: true,
      }),
    });

    const data = (await resp.json()) as PerplexityResponse;
    if (!resp.ok) return null;

    const answer = data.choices?.[0]?.message?.content ?? "";
    const citations = Array.isArray(data.citations) ? data.citations : [];
    return { answer, citations };
  } catch {
    return null; // network error — degrade gracefully
  }
}

// ── Citation detection ────────────────────────────────────────────────────────

const HOMEUP_PATTERNS = [/homeup\.sg/i, /\bhomeup\b/i, /home\s*up\s*sg/i];

function detectCitation(answer: string, citations: string[]): boolean {
  const haystack = [answer, ...citations].join(" ");
  return HOMEUP_PATTERNS.some((re) => re.test(haystack));
}

// ── Question extraction ───────────────────────────────────────────────────────

/**
 * Pulls target questions from an article row.
 * Uses the FAQ array first (structured), then falls back to parsing
 * bare "Q: ..." lines from the article body.
 * Returns at most 6 questions to limit API spend.
 */
export function extractQuestions(article: {
  faq?: { q: string; a: string }[] | null;
  article?: string | null;
}): string[] {
  const questions: string[] = [];

  // 1. Structured FAQ
  if (Array.isArray(article.faq)) {
    for (const { q } of article.faq) {
      if (q?.trim()) questions.push(q.trim());
    }
  }

  // 2. Inline "Q: ..." lines from article body if we need more
  if (questions.length < 3 && article.article) {
    const qLines = article.article.match(/^Q:\s*(.+)/gm) ?? [];
    for (const line of qLines) {
      const q = line.replace(/^Q:\s*/, "").trim();
      if (q && !questions.includes(q)) questions.push(q);
    }
  }

  return questions.slice(0, 6);
}

// ── Main checker ──────────────────────────────────────────────────────────────

export function isAiCitationsConfigured(): boolean {
  return Boolean(process.env.PERPLEXITY_API_KEY);
}

/**
 * Runs citation checks for one article — queries each question in sequence
 * (to avoid rate-limit bursts), stores results in ai_citations, returns summary.
 *
 * Returns null if PERPLEXITY_API_KEY is not set.
 */
export async function checkArticleCitations(article: {
  slug: string;
  faq?: { q: string; a: string }[] | null;
  article?: string | null;
}): Promise<ArticleCitationScore | null> {
  if (!isAiCitationsConfigured()) return null;

  const questions = extractQuestions(article);
  if (questions.length === 0) return null;

  const results: CitationResult[] = [];

  for (const question of questions) {
    const engine = await queryAnswerEngine(question);

    if (!engine) {
      // API failed for this question — record as not-cited but don't abort
      results.push({ question, cited: false, answerExcerpt: "" });
      continue;
    }

    const cited = detectCitation(engine.answer, engine.citations);
    const answerExcerpt = engine.answer.slice(0, 400);
    results.push({ question, cited, answerExcerpt });

    // Small delay between questions to respect rate limits
    await new Promise((r) => setTimeout(r, 800));
  }

  const citedCount = results.filter((r) => r.cited).length;
  const checkedAt = new Date().toISOString();

  // Persist to DB
  await persistCitationResults(article.slug, results, checkedAt);

  return {
    slug: article.slug,
    citedCount,
    totalQuestions: results.length,
    score: results.length > 0 ? citedCount / results.length : 0,
    checkedAt,
    results,
  };
}

// ── DB persistence ────────────────────────────────────────────────────────────

async function persistCitationResults(
  slug: string,
  results: CitationResult[],
  checkedAt: string,
): Promise<void> {
  const supabase = createServiceClient();

  const rows = results.map((r) => ({
    slug,
    question: r.question,
    cited: r.cited,
    answer_excerpt: r.answerExcerpt || null,
    checked_at: checkedAt,
  }));

  if (rows.length === 0) return;
  await supabase.from("ai_citations").insert(rows);
}

// ── Summary queries ───────────────────────────────────────────────────────────

/**
 * Returns the latest citation summary per slug (most recent check run per slug).
 * Used to populate the analytics dashboard.
 */
export async function getCitationSummaries(slugs: string[]): Promise<CitationSummary[]> {
  if (slugs.length === 0) return [];

  const supabase = createServiceClient();

  // Fetch the most recent checked_at per slug, then all rows for those timestamps
  const { data } = await supabase
    .from("ai_citations")
    .select("slug, question, cited, checked_at")
    .in("slug", slugs)
    .order("checked_at", { ascending: false });

  if (!data || data.length === 0) return [];

  // Group by slug, take the latest check run per slug
  const latestRun = new Map<string, string>(); // slug → latest checked_at
  for (const row of data) {
    if (!latestRun.has(row.slug)) latestRun.set(row.slug, row.checked_at as string);
  }

  const summaries: CitationSummary[] = [];

  for (const slug of slugs) {
    const runTs = latestRun.get(slug);
    if (!runTs) continue;

    const runRows = data.filter(
      (r) => r.slug === slug && r.checked_at === runTs,
    );

    const citedCount = runRows.filter((r) => r.cited).length;
    summaries.push({
      slug,
      citedCount,
      totalQuestions: runRows.length,
      score: runRows.length > 0 ? citedCount / runRows.length : 0,
      checkedAt: runTs,
    });
  }

  return summaries;
}

/**
 * Returns the full results of the most recent citation check for one article.
 */
export async function getArticleCitationDetail(slug: string): Promise<CitationResult[]> {
  const supabase = createServiceClient();

  // Find latest checked_at for this slug
  const { data: latest } = await supabase
    .from("ai_citations")
    .select("checked_at")
    .eq("slug", slug)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return [];

  const { data } = await supabase
    .from("ai_citations")
    .select("question, cited, answer_excerpt")
    .eq("slug", slug)
    .eq("checked_at", latest.checked_at);

  return (data ?? []).map((r) => ({
    question: r.question as string,
    cited: r.cited as boolean,
    answerExcerpt: (r.answer_excerpt as string | null) ?? "",
  }));
}
