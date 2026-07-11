import type { TopicCategory } from "./radarConfig";

/**
 * Minimum LLM audit score (0–10) required to publish an article.
 * Defined here (not in audit.ts) so client components can import it
 * without pulling in the server-only @anthropic-ai/sdk dependency.
 */
export const PUBLISH_THRESHOLD = 8;

export interface TopicCandidate {
  id: string;
  title: string;
  searchIntent: string;
  category: TopicCategory;
  demand: "high" | "medium" | "low";
  evergreen: boolean;
  tags: string[];
  /** Composite relevance score 0–100 */
  score?: number;
  /** "radar" = curated list; "custom" = user-entered */
  source: "radar" | "custom";
  /** True when a matching article is already live on /playbook */
  alreadyPublished?: boolean;
  /** Live /playbook article that covers this topic (when alreadyPublished) */
  matchedArticle?: { slug: string; title: string };
}

export interface Brief {
  topic: TopicCandidate;
  seoTitle: string;
  h2Questions: string[];
  primaryKeywords: string[];
  secondaryKeywords: string[];
  authorSlug: string;
  authorName: string;
  /** CEA registration number for the assigned author */
  authorCea: string;
  targetWordCount: number;
}

export interface Draft {
  brief: Brief;
  title: string;
  description: string;
  metaDescription: string;
  article: string;
  faq: { q: string; a: string }[];
  thumbnail?: string;
}

export interface ComplianceResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  /** Patched article with compliance issues auto-fixed (may be same as input) */
  patchedArticle: string;
}

export interface AuditScores {
  structure: number;   // 0–100: required sections present (heuristic)
  seo: number;         // 0–100: keyword usage, meta length (heuristic, or llm.seo * 10)
  compliance: number;  // 0–100: CEA rule adherence (heuristic)
  overall: number;     // 0–100 weighted average (heuristic) OR llm.overall * 10
  /** Present when the real LLM audit succeeded — used for the publish gate */
  llm?: {
    seo: number;       // 0–10
    geo: number;       // 0–10
    aeo: number;       // 0–10
    overall: number;   // 0–10 weighted
    fixes: string[];
    passesGate: boolean;
  };
}

export interface PackagedArticle {
  draft: Draft;
  compliance: ComplianceResult;
  audit: AuditScores;
  tags: string[];
  /** Publish-ready slug (without timestamp — added on publish) */
  suggestedSlug: string;
}
