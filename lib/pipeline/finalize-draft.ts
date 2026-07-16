/**
 * Normalizes AI drafts into the same structured shape as the admin Playbook editor:
 * article_sections JSON + faq column + serialized markdown body (no inline FAQ block).
 */
import {
  articleSectionsFromMarkdownArticle,
  createSectionId,
  emptyArticleSections,
  normalizeArticleSections,
  plainTextToSectionHtml,
  serializeArticleSectionsToMarkdown,
  validateArticleSections,
  type ArticleSections,
  type FaqEntry,
} from "@/lib/playbook/article-sections";
import { isHtmlEmpty } from "@/lib/playbook/html-text-utils";
import {
  normalizeArticleFormat,
  parseInlineFaq,
  parsePlaybookArticleBlocks,
} from "@/lib/playbook/article-format";
import { sanitizeAgencyTerminology } from "@/lib/pipeline/cea-terminology";
import { BRAND, trackedWhatsappUrl } from "@/lib/pipeline/brand";
import type { Brief, Draft } from "@/lib/pipeline/types";

const MAX_CARD_DESCRIPTION_WORDS = 35;
const MIN_FAQ_PAIRS = 3;

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeFaq(items: FaqEntry[]): FaqEntry[] {
  const seen = new Set<string>();
  const out: FaqEntry[] = [];
  for (const item of items) {
    const q = item.q.trim();
    const a = item.a.trim();
    if (!q || !a) continue;
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ q, a });
  }
  return out;
}

function collectFaqFromArticle(article: string, existing: FaqEntry[]): FaqEntry[] {
  const blocks = parsePlaybookArticleBlocks(article);
  const fromBlocks = blocks.flatMap((block) =>
    block.kind === "faq" ? block.items : [],
  );
  const fromInline = parseInlineFaq(article);
  return dedupeFaq([...existing, ...fromBlocks, ...fromInline]);
}

function defaultHomeupSection(brief: Brief, slugHint: string): string {
  const topic = brief.topic.title.toLowerCase();
  return [
    `At HomeUp, ${brief.authorName} and our team of CEA-licensed property agents help Singapore homeowners with ${topic}.`,
    `We charge a fixed fee — HDB from ${BRAND.fees.hdb}, Condo/EC from ${BRAND.fees.condoEc}, Landed from ${BRAND.fees.landed} — not a percentage commission.`,
    `Book a free planning call: ${trackedWhatsappUrl(slugHint)}`,
  ].join("\n\n");
}

function defaultConclusionSection(brief: Brief, quickAnswerPlain: string, slugHint: string): string {
  const summary = quickAnswerPlain
    ? quickAnswerPlain.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")
    : `This guide covers the key points for ${brief.topic.title.toLowerCase()}.`;
  return [
    summary,
    `If you want personalised numbers for your situation, WhatsApp ${brief.authorName} at HomeUp: ${trackedWhatsappUrl(slugHint)}`,
  ].join("\n\n");
}

function ensureQuestionSections(sections: ArticleSections, brief: Brief): ArticleSections {
  if (sections.sections.some((s) => s.title.trim() && !isHtmlEmpty(s.body))) {
    return sections;
  }

  const introPlain = htmlToPlain(sections.introduction);
  const lines = introPlain.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const questionLines = lines.filter((l) => l.endsWith("?") && l.length >= 15);

  if (questionLines.length > 0) {
    return {
      ...sections,
      introduction: plainTextToSectionHtml(
        lines.filter((l) => !questionLines.includes(l)).join("\n\n") || introPlain,
      ),
      sections: questionLines.map((title) => ({
        id: createSectionId(),
        title,
        body: plainTextToSectionHtml(
          "See the sections above for a full explanation, or WhatsApp HomeUp for advice tailored to your situation.",
        ),
      })),
    };
  }

  const fromBrief = brief.h2Questions.slice(0, 4).map((title) => ({
    id: createSectionId(),
    title: title.endsWith("?") ? title : `${title}?`,
    body: plainTextToSectionHtml(
      "This depends on your profile, timeline, and financing. WhatsApp HomeUp for personalised guidance.",
    ),
  }));

  return { ...sections, sections: fromBrief };
}

function fillMissingSections(
  sections: ArticleSections,
  brief: Brief,
  slugHint: string,
  autoFixes: string[],
): ArticleSections {
  let result = { ...sections };
  const qaPlain = htmlToPlain(result.quickAnswer);

  if (isHtmlEmpty(result.quickAnswer) && !isHtmlEmpty(result.introduction)) {
    result = {
      ...result,
      quickAnswer: plainTextToSectionHtml(htmlToPlain(result.introduction).split(/\n\n+/)[0] ?? ""),
    };
    autoFixes.push("Copied opening copy into Quick Answer");
  }

  if (isHtmlEmpty(result.introduction) && !isHtmlEmpty(result.quickAnswer)) {
    const author = brief.authorCea
      ? `${brief.authorName} (CEA Reg No. ${brief.authorCea})`
      : brief.authorName;
    result = {
      ...result,
      introduction: plainTextToSectionHtml(
        `This guide is for Singapore homeowners researching ${brief.topic.title.toLowerCase()}. I'm ${author}, a fixed-fee property agent with HomeUp.`,
      ),
    };
    autoFixes.push("Added Introduction from author template");
  }

  if (isHtmlEmpty(result.homeup)) {
    result = {
      ...result,
      homeup: plainTextToSectionHtml(defaultHomeupSection(brief, slugHint)),
    };
    autoFixes.push("Added How HomeUp Approaches This section");
  }

  if (isHtmlEmpty(result.conclusion)) {
    result = {
      ...result,
      conclusion: plainTextToSectionHtml(defaultConclusionSection(brief, qaPlain, slugHint)),
    };
    autoFixes.push("Added Conclusion section");
  }

  result = ensureQuestionSections(result, brief);
  if (result.sections.length > sections.sections.length) {
    autoFixes.push("Added question sections from brief headings");
  }

  return result;
}

function ensureFaqItems(faq: FaqEntry[], brief: Brief, autoFixes: string[]): FaqEntry[] {
  let items = dedupeFaq(faq);

  for (const question of brief.h2Questions) {
    if (items.length >= MIN_FAQ_PAIRS) break;
    const q = question.endsWith("?") ? question : `${question}?`;
    if (items.some((item) => item.q.toLowerCase() === q.toLowerCase())) continue;
    items.push({
      q,
      a: "This depends on your situation. WhatsApp HomeUp for personalised advice based on your timeline and financing.",
    });
  }

  while (items.length < MIN_FAQ_PAIRS) {
    items.push({
      q: `How can HomeUp help with ${brief.topic.title.toLowerCase()}?`,
      a: `Our CEA-licensed agents provide fixed-fee guidance on ${brief.topic.title.toLowerCase()} — WhatsApp us for a free planning call.`,
    });
  }

  if (items.length > faq.length) {
    autoFixes.push(`Ensured FAQ has at least ${MIN_FAQ_PAIRS} pairs`);
  }

  return items.slice(0, 8);
}

export type FinalizedDraft = {
  draft: Draft;
  articleSections: ArticleSections;
  autoFixes: string[];
};

/** Map raw AI output into admin-compatible structured sections + FAQ field. */
export function finalizePipelineDraft(draft: Draft, slugHint = ""): FinalizedDraft {
  const autoFixes: string[] = [];
  const normalizedArticle = normalizeArticleFormat(draft.article);

  let faq = collectFaqFromArticle(normalizedArticle, draft.faq);
  let sections = articleSectionsFromMarkdownArticle(normalizedArticle);

  if (isHtmlEmpty(sections.quickAnswer) && isHtmlEmpty(sections.introduction)) {
    sections = {
      ...emptyArticleSections(),
      introduction: plainTextToSectionHtml(normalizedArticle.slice(0, 800)),
    };
    autoFixes.push("Structured empty draft from raw article text");
  }

  sections = fillMissingSections(sections, draft.brief, slugHint, autoFixes);
  faq = ensureFaqItems(faq, draft.brief, autoFixes);

  sections = normalizeArticleSections(sections);

  const validation = validateArticleSections(sections, faq);
  if (!validation.ok) {
    autoFixes.push(`Validation auto-repair: ${validation.errors.join("; ")}`);
    sections = fillMissingSections(sections, draft.brief, slugHint, autoFixes);
    faq = ensureFaqItems(faq, draft.brief, autoFixes);
    sections = normalizeArticleSections(sections);
  }

  let serializedArticle = serializeArticleSectionsToMarkdown(sections);
  const sanitized = sanitizeAgencyTerminology(serializedArticle);
  serializedArticle = sanitized.text;
  if (sanitized.fixes.length > 0) {
    autoFixes.push(...sanitized.fixes.map((fix) => `Terminology: ${fix}`));
    sections = articleSectionsFromMarkdownArticle(serializedArticle);
  }

  const descriptionSource = draft.description.trim() || htmlToPlain(sections.quickAnswer);
  const description = trimWords(descriptionSource, MAX_CARD_DESCRIPTION_WORDS);
  if (description !== draft.description.trim()) {
    autoFixes.push(`Trimmed card description to ${MAX_CARD_DESCRIPTION_WORDS} words`);
  }

  let metaDescription = draft.metaDescription.trim();
  if (!metaDescription) {
    metaDescription = trimWords(
      `${draft.title}. ${htmlToPlain(sections.quickAnswer)}`.slice(0, 155),
      24,
    ).slice(0, 155);
    autoFixes.push("Generated meta description from Quick Answer");
  }

  return {
    draft: {
      ...draft,
      article: serializedArticle,
      description,
      metaDescription: metaDescription.slice(0, 155),
      faq,
      articleSections: sections,
    },
    articleSections: sections,
    autoFixes: [...new Set(autoFixes)],
  };
}
