import type { AuditScores, ComplianceResult, Draft, PackagedArticle } from "./types";
import type { LlmAuditResult } from "./audit";
import {
  articleSectionsFromMarkdownArticle,
  validateArticleSections,
} from "@/lib/playbook/article-sections";

function scoreStructure(draft: Draft): number {
  const sections =
    draft.articleSections ?? articleSectionsFromMarkdownArticle(draft.article);
  const validation = validateArticleSections(sections, draft.faq);
  if (validation.ok) return 100;

  const requiredChecks = [
    sections.quickAnswer,
    sections.introduction,
    sections.homeup,
    sections.conclusion,
    draft.faq.length >= 3,
    sections.sections.some((s) => s.title.trim()),
  ];
  const passed = requiredChecks.filter(Boolean).length;
  return Math.round((passed / requiredChecks.length) * 100);
}

function scoreSeo(draft: Draft): number {
  let score = 0;
  const article = draft.article.toLowerCase();
  const meta = draft.metaDescription;

  if (meta && meta.length >= 50 && meta.length <= 155) score += 30;
  else if (meta && meta.length > 0) score += 15;

  if (draft.title && draft.title.length <= 70) score += 20;

  const keywords = draft.brief.primaryKeywords;
  const hits = keywords.filter((kw) => article.includes(kw.toLowerCase()));
  score += Math.round((hits.length / Math.max(keywords.length, 1)) * 30);

  if (draft.faq.length >= 3) score += 20;

  return Math.min(score, 100);
}

function scoreCompliance(compliance: ComplianceResult): number {
  if (compliance.passed) return 100;
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

function isUsableLlmAudit(llm: LlmAuditResult | null | undefined): llm is LlmAuditResult {
  if (!llm) return false;
  return llm.seo + llm.geo + llm.aeo > 0;
}

/**
 * Assembles the final packaged article with audit scores and suggested slug.
 */
export function packageArticle(
  draft: Draft,
  compliance: ComplianceResult,
  llmAudit?: LlmAuditResult | null,
): PackagedArticle {
  const structure = scoreStructure(draft);
  const heuristicSeo = scoreSeo(draft);
  const comp = scoreCompliance(compliance);

  const llm = isUsableLlmAudit(llmAudit) ? llmAudit : undefined;

  const overall = llm
    ? Math.round(llm.overall * 10)
    : Math.round(structure * 0.4 + heuristicSeo * 0.35 + comp * 0.25);

  const seo = llm ? Math.round(llm.seo * 10) : heuristicSeo;

  const audit: AuditScores = {
    structure,
    seo,
    compliance: comp,
    overall,
    ...(llm ? { llm } : {}),
  };

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
