import type { TopicCategory } from "./radarConfig";

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
}

export interface Brief {
  topic: TopicCandidate;
  seoTitle: string;
  h2Questions: string[];
  primaryKeywords: string[];
  secondaryKeywords: string[];
  authorSlug: string;
  authorName: string;
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
  structure: number; // 0–100: required sections present
  seo: number; // 0–100: keyword usage, meta length
  compliance: number; // 0–100: CEA rule adherence
  overall: number; // weighted average
}

export interface PackagedArticle {
  draft: Draft;
  compliance: ComplianceResult;
  audit: AuditScores;
  tags: string[];
  /** Publish-ready slug (without timestamp — added on publish) */
  suggestedSlug: string;
}
