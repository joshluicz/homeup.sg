import { generateBrief } from "./brief";
import { checkCompliance } from "./compliance";
import { draftArticle } from "./draft";
import { packageArticle } from "./packageArticle";
import { getTransactionStats } from "./transactions";
import type { PackagedArticle, TopicCandidate } from "./types";

export interface GenerateProgress {
  step: "brief" | "draft" | "compliance" | "package" | "done";
  message: string;
}

/**
 * Orchestrates the full article generation pipeline:
 * topic → brief → transaction stats → draft → compliance → package
 *
 * Transaction stats are fetched in parallel with brief generation.
 * If unavailable (empty DB, network error), the draft proceeds without them.
 */
export async function generateArticle(topic: TopicCandidate): Promise<PackagedArticle> {
  // Fetch brief and transaction stats concurrently
  const [brief, transactionStats] = await Promise.all([
    generateBrief(topic),
    getTransactionStats(topic.category).catch(() => null),
  ]);

  // Derive a slug hint from the topic title so the draft gets a tracked WhatsApp CTA
  const slugHint = topic.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const draft = await draftArticle(brief, transactionStats, slugHint);
  const compliance = await checkCompliance(draft);
  return packageArticle(draft, compliance);
}
