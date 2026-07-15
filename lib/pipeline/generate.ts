import { generateBrief } from "./brief";
import { checkCompliance } from "./compliance";
import { sanitizeDraftFields } from "./cea-terminology";
import { draftArticle } from "./draft";
import { finalizePipelineDraft } from "./finalize-draft";
import { packageArticle } from "./packageArticle";
import { getTransactionStats } from "./transactions";
import { addInternalLinks } from "./internalLinks";
import { runLlmAudit } from "./audit";
import type { BriefOptions } from "./brief";
import type { PackagedArticle, TopicCandidate } from "./types";

export interface GenerateArticleOptions extends BriefOptions {}

export interface GenerateProgress {
  step: "brief" | "draft" | "compliance" | "package" | "done";
  message: string;
}

/**
 * Orchestrates the full article generation pipeline:
 * topic → brief + transaction stats → draft → finalize (structured sections)
 *       → compliance → internal links + LLM audit → package
 */
export async function generateArticle(
  topic: TopicCandidate,
  opts?: GenerateArticleOptions,
): Promise<PackagedArticle> {
  const [brief, transactionStats] = await Promise.all([
    generateBrief(topic, opts),
    getTransactionStats(topic.category).catch(() => null),
  ]);

  const slugHint = topic.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const rawDraft = await draftArticle(brief, transactionStats, slugHint);
  const sanitized = sanitizeDraftFields(rawDraft);
  const { draft: finalizedDraft, autoFixes } = finalizePipelineDraft(
    {
      ...sanitized,
      brief,
      title: sanitized.title || brief.seoTitle,
    },
    slugHint,
  );

  let compliance = await checkCompliance(finalizedDraft);
  let workingDraft = finalizedDraft;

  if (compliance.patchedArticle && compliance.patchedArticle !== finalizedDraft.article) {
    workingDraft = finalizePipelineDraft(
      { ...finalizedDraft, article: compliance.patchedArticle },
      slugHint,
    ).draft;
    compliance = await checkCompliance(workingDraft);
  } else if (!compliance.passed) {
    const retry = finalizePipelineDraft(workingDraft, slugHint);
    workingDraft = retry.draft;
    compliance = await checkCompliance(workingDraft);
  }

  const patchedArticle = compliance.patchedArticle || workingDraft.article;
  const draftForEnrichment = { ...workingDraft, article: patchedArticle };

  const [{ article: linkedArticle, links }, llmAudit] = await Promise.all([
    addInternalLinks(patchedArticle, draftForEnrichment.title, slugHint).catch(() => ({
      article: patchedArticle,
      links: [],
    })),
    runLlmAudit(brief, patchedArticle, draftForEnrichment.metaDescription).catch(() => null),
  ]);

  const finalDraft = { ...draftForEnrichment, article: linkedArticle };
  const finalCompliance = { ...compliance, patchedArticle: linkedArticle };

  const structureWarnings = autoFixes.map((fix) => `Auto-structured: ${fix}`);
  finalCompliance.warnings = [...finalCompliance.warnings, ...structureWarnings];

  if (sanitized.terminologyFixes.length > 0) {
    finalCompliance.warnings = [
      ...finalCompliance.warnings,
      ...sanitized.terminologyFixes.map((fix) => `Auto-corrected terminology: ${fix}`),
    ];
  }

  const packaged = packageArticle(finalDraft, finalCompliance, llmAudit);

  if (links.length > 0) {
    packaged.tags = Array.from(new Set([...packaged.tags, "internal-links"]));
  }

  return packaged;
}
