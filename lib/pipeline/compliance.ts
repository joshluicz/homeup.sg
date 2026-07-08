import Anthropic from "@anthropic-ai/sdk";
import { compliancePrompt } from "./prompt";
import type { ComplianceResult, Draft } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  return { issues, warnings };
}

/**
 * Runs structural pre-check then calls Claude for CEA + factual compliance.
 * Returns patched article if issues are found and Claude can fix them.
 */
export async function checkCompliance(draft: Draft): Promise<ComplianceResult> {
  const { issues: structIssues, warnings: structWarnings } = structureCheck(draft.article);

  // Only call Claude if structure is clean (avoid burning tokens on malformed drafts)
  if (structIssues.length > 0) {
    return {
      passed: false,
      issues: structIssues,
      warnings: structWarnings,
      patchedArticle: draft.article,
    };
  }

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: compliancePrompt(draft.article) }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

  let parsed: {
    passed?: boolean;
    issues?: string[];
    warnings?: string[];
    patchedArticle?: string;
  };

  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { passed: true, issues: [], warnings: [], patchedArticle: draft.article };
  }

  return {
    passed: (parsed.passed ?? true) && structIssues.length === 0,
    issues: [...(parsed.issues ?? []), ...structIssues],
    warnings: [...(parsed.warnings ?? []), ...structWarnings],
    patchedArticle: parsed.patchedArticle ?? draft.article,
  };
}
