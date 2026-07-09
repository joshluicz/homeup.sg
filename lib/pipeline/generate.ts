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

  const draft = await draftArticle(brief, transactionStats);
  const compliance = await checkCompliance(draft);
  return packageArticle(draft, compliance);
}
