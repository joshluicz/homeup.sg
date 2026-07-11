import type { PublishedArticleRef } from "./publishTarget";

/** Why a radar topic was marked as already covered on /playbook. */
export type CoverageMatchReason = "jaccard" | "entity_tuple" | "topic_id";

export interface TopicCoverageMatch {
  covered: boolean;
  matchedArticle?: PublishedArticleRef;
  reason?: CoverageMatchReason;
}

const STOPWORDS = new Set([
  "a", "an", "the", "to", "for", "in", "of", "and", "or", "your", "how", "when",
  "what", "is", "it", "do", "you", "can", "i", "my", "we", "our", "are", "was",
  "be", "been", "being", "have", "has", "had", "will", "would", "should", "could",
  "from", "with", "at", "by", "on", "as", "that", "this", "these", "those", "their",
  "they", "them", "its", "into", "about", "after", "before", "during", "through",
  "singapore", "guide", "2026", "2025", "step", "steps", "real", "actually", "really",
  "vs", "versus", "behind", "numbers", "decision", "complete", "full", "new", "get",
]);

/** Domain terms kept for entity-tuple matching (HDB, condo, CPF, etc.). */
const PRIMARY_ENTITIES = new Set([
  "hdb", "condo", "condominium", "bto", "ec", "executive", "landed", "flat",
  "absd", "bsd", "cpf", "mop", "upgrade", "upgrader", "upgrading", "downgrade",
  "resale", "sell", "selling", "seller", "buy", "buying", "buyer", "purchase",
  "commission", "decouple", "decoupling", "decoupled", "stamp", "duty", "ssd",
  "loan", "mortgage", "grant", "grants", "lease", "tenancy", "rent", "rental",
  "tenure", "otp", "hfe", "bto", "ec", "ura", "iras", "cea", "tdsr", "msr",
  "cash", "proceeds", "refund", "accrued", "interest", "negative", "valuation",
  "inheritance", "inherit", "trust", "trustee", "absd", "pr", "sc", "foreigner",
]);

const JACCARD_THRESHOLD = 0.6;
const ENTITY_JACCARD_FLOOR = 0.35;
const MIN_SHARED_ENTITIES = 2;

function normalizeToken(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Content-word set from a title or slug (stopwords removed). */
export function tokenizeForDedup(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map(normalizeToken)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  return new Set(words);
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function primaryEntities(words: Set<string>): Set<string> {
  const entities = new Set<string>();
  for (const word of words) {
    if (PRIMARY_ENTITIES.has(word)) entities.add(word);
  }
  return entities;
}

function stripPublishSlugSuffix(slug: string): string {
  return slug.replace(/-2026-guide$/, "").replace(/-\d{10,13}$/, "");
}

function topicIdMatchesSlug(topicId: string, slug: string): boolean {
  const stem = stripPublishSlugSuffix(slug);
  return stem === topicId || stem.startsWith(`${topicId}-`);
}

/**
 * Returns whether a candidate topic is already covered on /playbook, and which
 * live article it matches (for UI links).
 */
export function matchTopicAgainstCatalog(
  topicTitle: string,
  published: PublishedArticleRef[],
  topicId?: string,
): TopicCoverageMatch {
  const topicWords = tokenizeForDedup(topicTitle);
  if (!topicWords.size) return { covered: false };

  const topicEntities = primaryEntities(topicWords);

  let best: {
    article: PublishedArticleRef;
    score: number;
    reason: CoverageMatchReason;
  } | null = null;

  for (const article of published) {
    if (topicId && topicIdMatchesSlug(topicId, article.slug)) {
      return { covered: true, matchedArticle: article, reason: "topic_id" };
    }

    const titleWords = tokenizeForDedup(article.title);
    const slugWords = tokenizeForDedup(stripPublishSlugSuffix(article.slug));
    const publishedWords = new Set([...titleWords, ...slugWords]);
    if (!publishedWords.size) continue;

    const score = jaccardSimilarity(topicWords, publishedWords);
    const sharedEntities = [...topicEntities].filter((e) => primaryEntities(publishedWords).has(e));

    const jaccardMatch = score >= JACCARD_THRESHOLD;
    const entityMatch =
      sharedEntities.length >= MIN_SHARED_ENTITIES && score >= ENTITY_JACCARD_FLOOR;

    if (!jaccardMatch && !entityMatch) continue;

    const reason: CoverageMatchReason = jaccardMatch ? "jaccard" : "entity_tuple";
    if (!best || score > best.score) {
      best = { article, score, reason };
    }
  }

  if (best) {
    return { covered: true, matchedArticle: best.article, reason: best.reason };
  }

  return { covered: false };
}

export function isTopicCovered(
  topicTitle: string,
  published: PublishedArticleRef[],
  topicId?: string,
): boolean {
  return matchTopicAgainstCatalog(topicTitle, published, topicId).covered;
}
