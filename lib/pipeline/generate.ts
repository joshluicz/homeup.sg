import { generateBrief } from "./brief";
import { checkCompliance } from "./compliance";
import { draftArticle } from "./draft";
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
 * topic → brief + transaction stats → draft → compliance
 *       → internal links + LLM audit (concurrent) → package
 *
 * Draft failures abort the pipeline. Optional enrichments (transaction stats,
 * internal links, LLM audit) degrade gracefully when unavailable.
 */
export async function generateArticle(
  topic: TopicCandidate,
  opts?: GenerateArticleOptions,
): Promise<PackagedArticle> {
  // Step 1: brief + transaction stats (concurrent)
  const [brief, transactionStats] = await Promise.all([
    generateBrief(topic, opts),
    getTransactionStats(topic.category).catch(() => null),
  ]);

  // Derive a slug hint from the topic title so the draft gets a tracked WhatsApp CTA
  const slugHint = topic.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  // Step 2: draft
  const draft = await draftArticle(brief, transactionStats, slugHint);

  // Step 3: compliance gate (must be sequential — patches the article)
  const compliance = await checkCompliance(draft);
  const patchedArticle = compliance.patchedArticle || draft.article;

  // Step 4: internal links + LLM audit (concurrent — both read but don't mutate draft)
  const [{ article: linkedArticle, links }, llmAudit] = await Promise.all([
    addInternalLinks(patchedArticle, draft.title, slugHint).catch(() => ({
      article: patchedArticle,
      links: [],
    })),
    runLlmAudit(brief, patchedArticle, draft.metaDescription).catch(() => null),
  ]);

  // Merge linked article back into draft/compliance
  const finalDraft = { ...draft, article: linkedArticle };
  const finalCompliance = { ...compliance, patchedArticle: linkedArticle };

  // Step 5: package
  const packaged = packageArticle(finalDraft, finalCompliance, llmAudit);

  // Attach internal link list to tags for UI display (non-breaking addition)
  if (links.length > 0) {
    packaged.tags = Array.from(new Set([...packaged.tags, "internal-links"]));
  }

  return packaged;
}
