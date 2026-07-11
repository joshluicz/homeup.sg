/**
 * Phase 4 — Real LLM audit (SEO / GEO / AEO rubric).
 *
 * Sends the draft to Claude with a structured rubric and gets back:
 *   - SEO score 0–10  (keyword coverage, title, meta, structure)
 *   - GEO score 0–10  (Generative Engine Optimisation — clarity, local specificity,
 *                       authoritative voice, direct answers)
 *   - AEO score 0–10  (Answer Engine Optimisation — Quick Answer quality, FAQ depth,
 *                       citation-worthy claims, schema potential)
 *   - overall score   (weighted: SEO 30%, GEO 40%, AEO 30%)
 *   - fixes[]         specific, actionable improvements
 *
 * Publish hard-gate: overall < PUBLISH_THRESHOLD (8) blocks publish in the UI.
 * If this call fails, the caller falls back to the heuristic audit.
 */

import { extractTextContent, getAnthropicClient, getLlmModel, stripJsonFences } from "./llm";
import { PUBLISH_THRESHOLD } from "./types";
import type { Brief } from "./types";

export { PUBLISH_THRESHOLD };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LlmAuditResult {
  seo: number;       // 0–10
  geo: number;       // 0–10
  aeo: number;       // 0–10
  overall: number;   // weighted 0–10, two decimal places
  fixes: string[];   // ordered: most impactful first
  passesGate: boolean;
}

// ── Rubric prompt ─────────────────────────────────────────────────────────────

function auditPrompt(brief: Brief, article: string, metaDescription: string): string {
  return `You are a senior SEO / GEO / AEO analyst reviewing a Singapore property article for HomeUP.

ARTICLE METADATA
Title: ${brief.seoTitle}
Primary keywords: ${brief.primaryKeywords.join(", ")}
Secondary keywords: ${brief.secondaryKeywords.join(", ")}
Meta description: ${metaDescription}

ARTICLE BODY:
---
${article.slice(0, 4000)}
---

Score the article on three dimensions. Each score is 0–10 (integer). Be strict — 8+ means genuinely excellent, 6–7 is good-but-improvable, <6 has real gaps.

SEO (0–10): keyword usage (primary KW in first 100 words, used 3–5× naturally), meta ≤155 chars with primary KW, descriptive title ≤65 chars, structured sections, no keyword stuffing.

GEO (0–10 — Generative Engine Optimisation): direct answer in first paragraph, local Singapore specificity (HDB/CPF/ABSD terms used accurately), authoritative voice without hype, short readable paragraphs, avoids vague generalities.

AEO (0–10 — Answer Engine Optimisation): Quick Answer section is concise and complete (2–4 sentences), FAQ covers real high-intent questions, claims are citation-worthy (attributed to HDB/URA/IRAS), schema-ready structured data potential, "Related guides" section present for internal links.

Return valid JSON only (no markdown fences):
{
  "seo": <integer 0-10>,
  "geo": <integer 0-10>,
  "aeo": <integer 0-10>,
  "fixes": ["most impactful fix first", "...", "..."]
}

fixes: 3–6 specific, actionable items the writer can apply in under 5 minutes each. If a dimension scored ≥9, skip minor nits for it.`;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Runs the LLM audit. Returns null on any failure — caller must fall back to
 * the heuristic audit from packageArticle.ts.
 */
export async function runLlmAudit(
  brief: Brief,
  article: string,
  metaDescription: string,
): Promise<LlmAuditResult | null> {
  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: getLlmModel(),
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: auditPrompt(brief, article, metaDescription),
        },
      ],
    });

    const raw = extractTextContent(message);
    const parsed = JSON.parse(stripJsonFences(raw || "{}")) as {
      seo?: number;
      geo?: number;
      aeo?: number;
      fixes?: string[];
    };

    const seo = clamp(Math.round(parsed.seo ?? 0));
    const geo = clamp(Math.round(parsed.geo ?? 0));
    const aeo = clamp(Math.round(parsed.aeo ?? 0));

    // Weighted overall: SEO 30%, GEO 40%, AEO 30%
    const overall = Math.round((seo * 0.3 + geo * 0.4 + aeo * 0.3) * 10) / 10;

    return {
      seo,
      geo,
      aeo,
      overall,
      fixes: Array.isArray(parsed.fixes) ? parsed.fixes.slice(0, 6) : [],
      passesGate: overall >= PUBLISH_THRESHOLD,
    };
  } catch {
    return null;
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(10, n));
}
