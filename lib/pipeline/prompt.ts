import { BRAND } from "./brand";
import { SG_FACTS } from "./sgFacts";
import type { Brief, TopicCandidate } from "./types";

const ARTICLE_FORMAT = `
Quick Answer:

[2–4 sentences — direct, specific answer first]

Introduction:

[Who this is for + brief Dennis/HomeUp intro — 2–3 sentences]

[Question heading ending with ? on its own line]

[Answer paragraph — 2–4 sentences max]

[Repeat 2–4 question sections]

How HomeUp Approaches This:

[How HomeUp helps with this specific situation + fixed-fee mention + CTA links]

Conclusion:

[Summary + optional CTA — 2–3 sentences]

FAQ:

Q: [question]? A: [answer.]

[Repeat Q/A pairs — 3–5 total]
`.trim();

const FORMAT_RULES = `
Rules:
- Short paragraphs — 2–4 sentences max.
- Question section headings must end with ? and sit on their own line (no ## markdown).
- Do NOT use ## markdown headings — use plain question lines only.
- Be accurate to Singapore property rules; do NOT invent figures, yield numbers, or legal specifics.
- Cite HDB, URA, CPF Board, IRAS by name when referencing rules. Do not cite specific URLs.
- Never guarantee investment returns or claim prices will definitely rise.
`.trim();

/** Prompt to generate an article brief: SEO title, H2 questions, keywords, author. */
export function briefPrompt(topic: TopicCandidate): string {
  return `You are a Singapore property content strategist for ${BRAND.name} — ${BRAND.tagline}.

TOPIC: "${topic.title}"
Search intent: ${topic.searchIntent}
Category: ${topic.category}
Tags: ${topic.tags.join(", ")}

Produce a structured article brief. Return valid JSON only (no markdown fences):

{
  "seoTitle": "Exact H1/title tag — keyword-rich, max 65 chars",
  "h2Questions": ["5–7 PAA-style questions as plain question headings (ending with ?)"],
  "primaryKeywords": ["3–5 main search terms"],
  "secondaryKeywords": ["4–6 related/LSI terms"],
  "targetWordCount": 550
}`;
}

/**
 * Prompt to draft the full article body from a brief.
 * @param transactionStats  Optional aggregate stats string from lib/pipeline/transactions.ts.
 *                          When present, Claude is instructed to cite the data naturally.
 *                          When null/undefined, the block is omitted — no error, no placeholder.
 */
export function draftPrompt(brief: Brief, transactionStats?: string | null): string {
  const sgGlossary = Object.entries(SG_FACTS.glossary)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const transactionBlock = transactionStats
    ? `\nHOMEUP FIRST-PARTY DATA — use 1–2 of these stats naturally where relevant. Cite as "based on our [N] sales in [Town]". Do not invent or extrapolate beyond what is listed:\n${transactionStats}\n`
    : "";

  return `You are writing a Playbook article for ${BRAND.name} (${BRAND.tagline}).
Author: ${brief.authorName}
Audience: Singapore homeowners researching "${brief.topic.title}"
Tone: ${BRAND.voice.tone}

SINGAPORE PROPERTY GLOSSARY (use these terms accurately):
${sgGlossary}

CEA COMPLIANCE — NEVER say:
${BRAND.voice.avoid.map((a) => `• ${a}`).join("\n")}
${transactionBlock}
SEO TITLE: ${brief.seoTitle}
PRIMARY KEYWORDS: ${brief.primaryKeywords.join(", ")}
H2 QUESTIONS TO ANSWER: ${brief.h2Questions.join(" | ")}
TARGET WORD COUNT: ~${brief.targetWordCount} words

REQUIRED ARTICLE FORMAT (use EXACTLY these section labels):
${ARTICLE_FORMAT}

${FORMAT_RULES}

In "How HomeUp Approaches This:" mention:
- HomeUp is a fixed-fee agency: HDB from ${BRAND.fees.hdb}, Condo/EC from ${BRAND.fees.condoEc}, Landed from ${BRAND.fees.landed}
- Encourage WhatsApp or link to /playbook for more guides

Return valid JSON only (no markdown fences):
{
  "title": "...",
  "description": "1–2 sentence card description, max 35 words",
  "metaDescription": "SEO meta description, max 155 chars, includes primary keyword",
  "article": "full article using the EXACT section format above",
  "faq": [{"q": "...", "a": "..."}]
}`;
}

/** Prompt to check CEA compliance and structural correctness. */
export function compliancePrompt(article: string): string {
  return `You are a CEA (Council for Estate Agencies) compliance reviewer for a Singapore property blog.

Check this article for:
1. Guaranteed returns or yield claims
2. False urgency ("act now", "never been a better time", etc.)
3. Misleading legal/financial figures not attributed to official sources
4. Missing required sections: Quick Answer, How HomeUp Approaches This, Conclusion, FAQ
5. Incorrect Singapore-specific facts (wrong ABSD rates, MOP period, etc.)

ARTICLE:
---
${article}
---

Return valid JSON only (no markdown fences):
{
  "passed": true/false,
  "issues": ["list of CEA violations that MUST be fixed"],
  "warnings": ["list of suggestions — not blocking"],
  "patchedArticle": "the article with issues corrected (return unchanged if passed=true)"
}`;
}
