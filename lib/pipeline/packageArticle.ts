import type { AuditScores, ComplianceResult, Draft, PackagedArticle } from "./types";
import type { LlmAuditResult } from "./audit";

const REQUIRED_SECTIONS = ["Quick Answer:", "How HomeUp Approaches This:", "Conclusion:", "FAQ:"];

function scoreStructure(article: string): number {
  const present = REQUIRED_SECTIONS.filter((s) => article.includes(s)).length;
  return Math.round((present / REQUIRED_SECTIONS.length) * 100);
}

function scoreSeo(draft: Draft): number {
  let score = 0;
  const article = draft.article.toLowerCase();
  const meta = draft.metaDescription;

  // Meta description present and within length
  if (meta && meta.length >= 50 && meta.length <= 155) score += 30;
  else if (meta && meta.length > 0) score += 15;

  // Title present
  if (draft.title && draft.title.length <= 70) score += 20;

  // Primary keywords appear in article
  const keywords = draft.brief.primaryKeywords;
  const hits = keywords.filter((kw) => article.includes(kw.toLowerCase()));
  score += Math.round((hits.length / Math.max(keywords.length, 1)) * 30);

  // FAQ section adds structured data value
  if (draft.faq.length >= 3) score += 20;

  return Math.min(score, 100);
}

function scoreCompliance(compliance: ComplianceResult): number {
  if (compliance.issues.length === 0) return 100;
  const deduction = compliance.issues.length * 20;
  return Math.max(0, 100 - deduction);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Assembles the final packaged article with audit scores and suggested slug.
 * @param llmAudit  Real LLM audit result (Phase 4). When provided, its scores
 *                  drive the headline numbers; heuristic scores remain as structure/compliance.
 */
export function packageArticle(
  draft: Draft,
  compliance: ComplianceResult,
  llmAudit?: LlmAuditResult | null,
): PackagedArticle {
  const structure = scoreStructure(compliance.patchedArticle || draft.article);
  const heuristicSeo = scoreSeo(draft);
  const comp = scoreCompliance(compliance);

  // Prefer real LLM overall (×10 to convert 0–10 → 0–100 scale), fall back to heuristic
  const overall = llmAudit
    ? Math.round(llmAudit.overall * 10)
    : Math.round(structure * 0.4 + heuristicSeo * 0.35 + comp * 0.25);

  const seo = llmAudit ? Math.round(llmAudit.seo * 10) : heuristicSeo;

  const audit: AuditScores = {
    structure,
    seo,
    compliance: comp,
    overall,
    ...(llmAudit ? { llm: llmAudit } : {}),
  };

  // Combine topic tags with detected property terms
  const tags = Array.from(
    new Set([
      ...draft.brief.topic.tags,
      ...draft.brief.primaryKeywords,
      draft.brief.topic.category,
    ]),
  ).slice(0, 8);

  return {
    draft: {
      ...draft,
      article: compliance.patchedArticle || draft.article,
    },
    compliance,
    audit,
    tags,
    suggestedSlug: slugify(draft.title),
  };
}
