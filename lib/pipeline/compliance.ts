import { compliancePrompt } from "./prompt";
import {
  detectAgencyTerminologyViolations,
  sanitizeAgencyTerminology,
} from "./cea-terminology";
import { extractTextContent, getAnthropicClient, getLlmModel, stripJsonFences } from "./llm";
import type { ComplianceResult, Draft } from "./types";

const REQUIRED_SECTIONS = [
  "Quick Answer:",
  "How HomeUp Approaches This:",
  "Conclusion:",
  "FAQ:",
];

/** Fast structural check without a Claude call. */
function structureCheck(article: string): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!article.includes(section)) {
      issues.push(`Missing required section: "${section}"`);
    }
  }

  if (/^\\s*</.test(article.trim())) {
    issues.push("Article appears to contain HTML — must use plain structured Markdown format.");
  }

  const wordCount = article.split(/\s+/).filter(Boolean).length;
  if (wordCount < 300) warnings.push(`Article is short (${wordCount} words); aim for 450–700.`);
  if (wordCount > 900) warnings.push(`Article is long (${wordCount} words); consider trimming.`);

  const terminologyIssues = detectAgencyTerminologyViolations(article);
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
  const { issues: structIssues, warnings: structWarnings } = structureCheck(draft.article);

  // Structural or terminology issues — sanitize what we can without burning Claude tokens
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
    messages: [{ role: "user", content: compliancePrompt(draft.article) }],
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
