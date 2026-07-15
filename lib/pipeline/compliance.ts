import { compliancePrompt } from "./prompt";
import {
  detectAgencyTerminologyViolations,
  sanitizeAgencyTerminology,
} from "./cea-terminology";
import {
  articleSectionsFromMarkdownArticle,
  validateArticleSections,
} from "@/lib/playbook/article-sections";
import { extractTextContent, getAnthropicClient, getLlmModel, stripJsonFences } from "./llm";
import type { ComplianceResult, Draft } from "./types";

/** Fast structural check — matches admin Playbook editor requirements. */
function structureCheck(draft: Draft): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  const sections =
    draft.articleSections ?? articleSectionsFromMarkdownArticle(draft.article);
  const validation = validateArticleSections(sections, draft.faq);
  if (!validation.ok) {
    issues.push(...validation.errors);
  }

  if (/^\s*</.test(draft.article.trim())) {
    issues.push("Article appears to contain HTML — must use plain structured Markdown format.");
  }

  const wordCount = draft.article.split(/\s+/).filter(Boolean).length;
  if (wordCount < 300) warnings.push(`Article is short (${wordCount} words); aim for 450–700.`);
  if (wordCount > 900) warnings.push(`Article is long (${wordCount} words); consider trimming.`);

  const terminologyIssues = detectAgencyTerminologyViolations(draft.article);
  for (const issue of terminologyIssues) {
    issues.push(issue);
  }

  return { issues, warnings };
}

/**
 * Runs structural pre-check then calls Claude for CEA + factual compliance.
 * Returns patched article if issues are found and Claude can fix them.
 */
export async function checkCompliance(draft: Draft): Promise<ComplianceResult> {
  const { issues: structIssues, warnings: structWarnings } = structureCheck(draft);

  if (structIssues.length > 0) {
    const { text: sanitized } = sanitizeAgencyTerminology(draft.article);
    const remaining = detectAgencyTerminologyViolations(sanitized);
    return {
      passed: false,
      issues: [...structIssues.filter((i) => !i.startsWith("CEA terminology")), ...remaining],
      warnings: structWarnings,
      patchedArticle: sanitized,
    };
  }

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: getLlmModel(),
    max_tokens: 4096,
    messages: [{ role: "user", content: compliancePrompt(draft.article, draft.faq.length) }],
  });

  const raw = extractTextContent(message);

  let parsed: {
    passed?: boolean;
    issues?: string[];
    warnings?: string[];
    patchedArticle?: string;
  };

  try {
    parsed = raw ? JSON.parse(stripJsonFences(raw)) : { passed: true, issues: [], warnings: [], patchedArticle: draft.article };
  } catch {
    parsed = { passed: true, issues: [], warnings: [], patchedArticle: draft.article };
  }

  let patchedArticle = parsed.patchedArticle ?? draft.article;
  const { text: sanitized, fixes } = sanitizeAgencyTerminology(patchedArticle);
  patchedArticle = sanitized;

  const terminologyWarnings = fixes.map((fix) => `Auto-corrected terminology: ${fix}`);
  const remainingTerminology = detectAgencyTerminologyViolations(patchedArticle);

  return {
    passed:
      (parsed.passed ?? true) &&
      structIssues.length === 0 &&
      remainingTerminology.length === 0,
    issues: [...(parsed.issues ?? []), ...structIssues, ...remainingTerminology],
    warnings: [...(parsed.warnings ?? []), ...structWarnings, ...terminologyWarnings],
    patchedArticle,
  };
}
