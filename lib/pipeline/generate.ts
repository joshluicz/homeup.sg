import { generateBrief } from "./brief";
import { checkCompliance } from "./compliance";
import { draftArticle } from "./draft";
import { packageArticle } from "./packageArticle";
import type { PackagedArticle, TopicCandidate } from "./types";

export interface GenerateProgress {
  step: "brief" | "draft" | "compliance" | "package" | "done";
  message: string;
}

/**
 * Orchestrates the full article generation pipeline:
 * topic → brief → draft → compliance → package
 */
export async function generateArticle(topic: TopicCandidate): Promise<PackagedArticle> {
  const brief = await generateBrief(topic);
  const draft = await draftArticle(brief);
  const compliance = await checkCompliance(draft);
  return packageArticle(draft, compliance);
}
