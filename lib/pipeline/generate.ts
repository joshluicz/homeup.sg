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
import type { Brief, Draft, PackagedArticle, TopicCandidate } from "./types";

export interface GenerateArticleOptions extends BriefOptions {}

export type GeneratePhase = "brief" | "draft" | "package" | "enrich";

export interface BriefPhaseResult {
  phase: "brief";
  brief: Brief;
  transactionStats: string | null;
  slugHint: string;
}

export interface DraftPhaseResult {
  phase: "draft";
  draft: Draft;
}

export interface EnrichPhaseResult {
  phase: "enrich";
  audit: PackagedArticle["audit"];
  draft: Pick<Draft, "article" | "metaDescription">;
  tags: string[];
}

export function topicSlugHint(topic: TopicCandidate): string {
  return topic.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/** Phase 1 — brief + transaction stats (one Claude call). */
export async function runBriefPhase(
  topic: TopicCandidate,
  opts?: GenerateArticleOptions,
): Promise<BriefPhaseResult> {
  const [brief, transactionStats] = await Promise.all([
    generateBrief(topic, opts),
    getTransactionStats(topic.category).catch(() => null),
  ]);

  return {
    phase: "brief",
    brief,
    transactionStats,
    slugHint: topicSlugHint(topic),
  };
}

/** Phase 2 — full article draft (one Claude call; often the slowest step). */
export async function runDraftPhase(
  brief: Brief,
  transactionStats: string | null,
  slugHint: string,
): Promise<DraftPhaseResult> {
  const rawDraft = await draftArticle(brief, transactionStats, slugHint);
  return { phase: "draft", draft: sanitizeDraftFields(rawDraft) };
}

async function resolveComplianceDraft(
  sanitized: Draft,
  slugHint: string,
): Promise<{
  finalDraft: Draft;
  finalCompliance: Awaited<ReturnType<typeof checkCompliance>>;
  autoFixes: string[];
  terminologyFixes: string[];
}> {
  const { draft: finalizedDraft, autoFixes } = finalizePipelineDraft(
    {
      ...sanitized,
      brief: sanitized.brief,
      title: sanitized.title || sanitized.brief.seoTitle,
    },
    slugHint,
  );

  let compliance = await checkCompliance(finalizedDraft);
  let workingDraft = finalizedDraft;

  if (compliance.patchedArticle && compliance.patchedArticle !== workingDraft.article) {
    workingDraft = finalizePipelineDraft(
      { ...workingDraft, article: compliance.patchedArticle },
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

  return {
    finalDraft: draftForEnrichment,
    finalCompliance: compliance,
    autoFixes,
    terminologyFixes: "terminologyFixes" in sanitized && Array.isArray(sanitized.terminologyFixes)
      ? sanitized.terminologyFixes
      : [],
  };
}

/** Phase 3 — structure, compliance gate, heuristic scores (no Claude). */
export async function runPackagePhase(
  sanitized: Draft,
  slugHint: string,
): Promise<PackagedArticle> {
  const { finalDraft, finalCompliance, autoFixes, terminologyFixes } =
    await resolveComplianceDraft(sanitized, slugHint);

  const finalComplianceWithWarnings = { ...finalCompliance, patchedArticle: finalDraft.article };

  const structureWarnings = autoFixes.map((fix) => `Auto-structured: ${fix}`);
  finalComplianceWithWarnings.warnings = [
    ...finalComplianceWithWarnings.warnings,
    ...structureWarnings,
  ];

  if (terminologyFixes.length > 0) {
    finalComplianceWithWarnings.warnings = [
      ...finalComplianceWithWarnings.warnings,
      ...terminologyFixes.map((fix) => `Auto-corrected terminology: ${fix}`),
    ];
  }

  return packageArticle(finalDraft, finalComplianceWithWarnings, null);
}

/** Phase 4 (optional) — LLM audit + internal links; safe to run after the UI shows the draft. */
export async function runEnrichPhase(
  packaged: PackagedArticle,
  slugHint: string,
): Promise<EnrichPhaseResult> {
  const { brief } = packaged.draft;
  const draft = packaged.draft;

  const [{ article: linkedArticle, links }, llmAudit] = await Promise.all([
    addInternalLinks(draft.article, draft.title, slugHint).catch(() => ({
      article: draft.article,
      links: [] as { slug: string; title: string }[],
    })),
    runLlmAudit(brief, draft.article, draft.metaDescription).catch(() => null),
  ]);

  const enrichedDraft = { ...draft, article: linkedArticle };
  const repackaged = packageArticle(enrichedDraft, packaged.compliance, llmAudit);

  const tags =
    links.length > 0
      ? Array.from(new Set([...repackaged.tags, "internal-links"]))
      : repackaged.tags;

  return {
    phase: "enrich",
    audit: repackaged.audit,
    draft: { article: linkedArticle, metaDescription: draft.metaDescription },
    tags,
  };
}

/**
 * Full pipeline in one call (scripts / legacy). Prefer phased calls from the admin UI
 * so each Vercel invocation stays under the platform timeout.
 */
export async function generateArticle(
  topic: TopicCandidate,
  opts?: GenerateArticleOptions,
): Promise<PackagedArticle> {
  const { brief, transactionStats, slugHint } = await runBriefPhase(topic, opts);
  const { draft: sanitized } = await runDraftPhase(brief, transactionStats, slugHint);
  const packaged = await runPackagePhase(sanitized, slugHint);

  try {
    const enrich = await runEnrichPhase(packaged, slugHint);
    return {
      ...packaged,
      audit: enrich.audit,
      draft: { ...packaged.draft, ...enrich.draft },
      tags: enrich.tags,
    };
  } catch {
    return packaged;
  }
}
