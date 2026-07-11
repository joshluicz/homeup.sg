/**
 * Phase 3 — backfill playbook_videos.article_sections from legacy article blobs.
 * Safe: backs up original article to article_legacy (once), never deletes content.
 */

import {
  articleHasInlineFaq,
  parseInlineFaq,
  parsePlaybookArticleBlocks,
} from "@/lib/playbook/article-format";
import { isHtmlContent } from "@/lib/playbook/is-html-content";
import { isHtmlEmpty, sanitizeArticleHtml } from "@/lib/playbook/sanitize-article-html";
import {
  type ArticleSections,
  type FaqEntry,
  hasStructuredArticleContent,
  isArticleSections,
  normalizeArticleSections,
  parseLegacyArticleToSections,
  serializeArticleSectionsToMarkdown,
  validateArticleSections,
} from "@/lib/playbook/article-sections";

export type BackfillConfidence = "high" | "medium" | "low" | "manual";

export type BackfillFlag =
  | "already_structured"
  | "skipped_no_body"
  | "html_source"
  | "markdown_source"
  | "missing_quick_answer"
  | "missing_introduction"
  | "missing_homeup"
  | "missing_conclusion"
  | "missing_question_sections"
  | "missing_faq"
  | "faq_extracted_from_body"
  | "faq_merged_from_body"
  | "validation_failed"
  | "intro_only_fallback"
  | "inline_faq_in_body";

export type PlaybookArticleRow = {
  id: string;
  slug: string;
  title: string;
  article: string | null;
  faq: FaqEntry[] | null;
  article_sections: ArticleSections | null;
  article_legacy: string | null;
  video_url?: string | null;
  content_kind?: string | null;
};

export type BackfillPlan = {
  slug: string;
  id: string;
  title: string;
  confidence: BackfillConfidence;
  flags: BackfillFlag[];
  issues: string[];
  articleSections: ArticleSections | null;
  faq: FaqEntry[];
  serializedArticle: string;
  wouldUpdate: boolean;
};

export type AuditRenderIssue =
  | "uses_html_render_path"
  | "uses_legacy_markdown_path"
  | "missing_structured_sections"
  | "missing_faq_column"
  | "faq_only_in_body"
  | "duplicate_faq_sources"
  | "validation_would_fail"
  | "no_quick_answer_box"
  | "structured_ready";

export type ArticleAuditEntry = {
  slug: string;
  id: string;
  title: string;
  renderPath: "structured_sections" | "html" | "structured_markdown" | "plain_markdown" | "empty";
  issues: AuditRenderIssue[];
  issueDetails: string[];
  flags: BackfillFlag[];
  confidence: BackfillConfidence | "n/a";
};

function normalizeFaq(raw: unknown): FaqEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is FaqEntry => Boolean(f && typeof f === "object" && f.q && f.a))
    .map((f) => ({
      q: String(f.q).trim().replace(/^Q:\s*/i, ""),
      a: String(f.a).trim().replace(/^A:\s*/i, ""),
    }))
    .filter((f) => f.q && f.a);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract FAQ pairs from HTML or markdown article body. */
export function extractFaqFromArticleBody(article: string): FaqEntry[] {
  const text = article?.trim() ?? "";
  if (!text) return [];

  if (isHtmlContent(text)) {
    const plain = htmlToPlainText(text);
    const fromPlain = parseInlineFaq(plain);
    if (fromPlain.length > 0) return fromPlain;

    const items: FaqEntry[] = [];
    const paraRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match: RegExpExecArray | null;
    while ((match = paraRe.exec(text)) !== null) {
      const plainPara = htmlToPlainText(match[1]);
      items.push(...parseInlineFaq(plainPara));
    }
    return items;
  }

  const blocks = parsePlaybookArticleBlocks(text);
  const faqBlock = blocks.find((b) => b.kind === "faq");
  if (faqBlock && faqBlock.kind === "faq" && faqBlock.items.length > 0) {
    return faqBlock.items;
  }

  return parseInlineFaq(text);
}

function mergeFaq(existing: FaqEntry[], extracted: FaqEntry[]): FaqEntry[] {
  const seen = new Set<string>();
  const merged: FaqEntry[] = [];

  for (const item of [...existing, ...extracted]) {
    const key = item.q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

function assessConfidence(
  sections: ArticleSections,
  faq: FaqEntry[],
  flags: BackfillFlag[],
): BackfillConfidence {
  if (flags.includes("validation_failed")) return "manual";
  if (flags.includes("intro_only_fallback")) return "low";

  const validation = validateArticleSections(sections, faq);
  if (!validation.ok) return "manual";

  if (flags.includes("html_source") && flags.includes("missing_question_sections")) {
    return "low";
  }

  if (flags.includes("faq_extracted_from_body") || flags.includes("html_source")) {
    return "medium";
  }

  return "high";
}

function collectSectionFlags(sections: ArticleSections): BackfillFlag[] {
  const flags: BackfillFlag[] = [];
  if (isHtmlEmpty(sections.quickAnswer)) flags.push("missing_quick_answer");
  if (isHtmlEmpty(sections.introduction)) flags.push("missing_introduction");
  if (isHtmlEmpty(sections.homeup)) flags.push("missing_homeup");
  if (isHtmlEmpty(sections.conclusion)) flags.push("missing_conclusion");
  if (sections.sections.filter((s) => s.title.trim()).length === 0) {
    flags.push("missing_question_sections");
  }
  return flags;
}

/** Build a migration plan for one playbook article row (no DB writes). */
export function planArticleBackfill(row: PlaybookArticleRow): BackfillPlan {
  const article = (row.article ?? "").trim();
  const existingFaq = normalizeFaq(row.faq);
  const flags: BackfillFlag[] = [];
  const issues: string[] = [];

  if (!article) {
    return {
      slug: row.slug,
      id: row.id,
      title: row.title,
      confidence: "n/a" as BackfillConfidence,
      flags: ["skipped_no_body"],
      issues: ["No article body — video-only or empty row."],
      articleSections: null,
      faq: existingFaq,
      serializedArticle: "",
      wouldUpdate: false,
    };
  }

  if (
    row.article_sections &&
    isArticleSections(row.article_sections) &&
    hasStructuredArticleContent(row.article_sections)
  ) {
    const validation = validateArticleSections(
      normalizeArticleSections(row.article_sections),
      existingFaq,
    );
    if (validation.ok) {
      return {
        slug: row.slug,
        id: row.id,
        title: row.title,
        confidence: "high",
        flags: ["already_structured"],
        issues: [],
        articleSections: normalizeArticleSections(row.article_sections),
        faq: existingFaq,
        serializedArticle: serializeArticleSectionsToMarkdown(
          normalizeArticleSections(row.article_sections),
        ),
        wouldUpdate: false,
      };
    }
    flags.push("validation_failed");
    issues.push(...validation.errors);
  }

  if (isHtmlContent(article)) flags.push("html_source");
  else flags.push("markdown_source");

  const articleSections = normalizeArticleSections(parseLegacyArticleToSections(article));
  flags.push(...collectSectionFlags(articleSections));

  if (
    isHtmlContent(article) &&
    flags.includes("missing_quick_answer") &&
    flags.includes("missing_homeup") &&
    !isHtmlEmpty(articleSections.introduction) &&
    articleSections.sections.length === 0
  ) {
    flags.push("intro_only_fallback");
    issues.push("HTML parsed to introduction-only — section labels not detected.");
  }

  let faq = existingFaq;
  const extractedFaq = extractFaqFromArticleBody(article);
  if (extractedFaq.length > 0) {
    const cleaned = extractedFaq.map((f) => ({
      q: f.q.replace(/^Q:\s*/i, "").trim(),
      a: f.a.replace(/^A:\s*/i, "").trim(),
    }));
    if (existingFaq.length === 0) {
      faq = cleaned;
      flags.push("faq_extracted_from_body");
    } else if (cleaned.length > existingFaq.length) {
      faq = mergeFaq(existingFaq, cleaned);
      flags.push("faq_merged_from_body");
    }
  }

  if (faq.length === 0) {
    flags.push("missing_faq");
    issues.push("No FAQ in faq column and none extracted from article body.");
  }

  const blocks = parsePlaybookArticleBlocks(article);
  if (articleHasInlineFaq(blocks)) flags.push("inline_faq_in_body");
  if (existingFaq.length > 0 && flags.includes("inline_faq_in_body")) {
    issues.push("FAQ exists both in body and faq column — body FAQ will be ignored after migration.");
  }

  const validation = validateArticleSections(articleSections, faq);
  if (!validation.ok) {
    flags.push("validation_failed");
    issues.push(...validation.errors);
  }

  const confidence = assessConfidence(articleSections, faq, flags);
  const serializedArticle = serializeArticleSectionsToMarkdown(articleSections);

  return {
    slug: row.slug,
    id: row.id,
    title: row.title,
    confidence,
    flags,
    issues,
    articleSections,
    faq,
    serializedArticle,
    wouldUpdate: confidence !== "manual" && !flags.includes("already_structured"),
  };
}

/** Audit how an article renders today (or would render after backfill). */
export function auditArticle(row: PlaybookArticleRow): ArticleAuditEntry {
  const article = (row.article ?? "").trim();
  const existingFaq = normalizeFaq(row.faq);
  const plan = planArticleBackfill(row);
  const issues: AuditRenderIssue[] = [];
  const issueDetails: string[] = [];

  if (!article) {
    return {
      slug: row.slug,
      id: row.id,
      title: row.title,
      renderPath: "empty",
      issues: ["missing_structured_sections"],
      issueDetails: ["No article body."],
      flags: plan.flags,
      confidence: plan.confidence,
    };
  }

  const hasDbSections =
    row.article_sections &&
    isArticleSections(row.article_sections) &&
    hasStructuredArticleContent(row.article_sections);

  let renderPath: ArticleAuditEntry["renderPath"];
  if (hasDbSections) {
    renderPath = "structured_sections";
    issues.push("structured_ready");
  } else if (isHtmlContent(article)) {
    renderPath = "html";
    issues.push("uses_html_render_path");
    issueDetails.push("Renders via PlaybookArticleHtml — layout not template-enforced.");
  } else {
    const blocks = parsePlaybookArticleBlocks(article);
    const isStructured = blocks.some((b) => b.kind !== "content");
    renderPath = isStructured ? "structured_markdown" : "plain_markdown";
    if (!isStructured) {
      issues.push("uses_legacy_markdown_path");
      issueDetails.push("Unlabeled markdown — minimal styling.");
    }
  }

  if (!hasDbSections) {
    issues.push("missing_structured_sections");
  }

  if (existingFaq.length === 0) {
    issues.push("missing_faq_column");
    issueDetails.push("faq jsonb column is empty — FAQ schema may be missing.");
  }

  if (plan.flags.includes("inline_faq_in_body") && existingFaq.length === 0) {
    issues.push("faq_only_in_body");
    issueDetails.push("FAQ buried in article body — no accordion unless parsed.");
  }

  if (plan.flags.includes("inline_faq_in_body") && existingFaq.length > 0) {
    issues.push("duplicate_faq_sources");
    issueDetails.push("FAQ in both body and faq column — display dedupes but confusing.");
  }

  if (plan.flags.includes("missing_quick_answer")) {
    issues.push("no_quick_answer_box");
    issueDetails.push("Quick Answer section not detected — no green callout card.");
  }

  if (plan.flags.includes("validation_failed")) {
    issues.push("validation_would_fail");
    issueDetails.push(...plan.issues);
  }

  return {
    slug: row.slug,
    id: row.id,
    title: row.title,
    renderPath,
    issues: [...new Set(issues)],
    issueDetails,
    flags: plan.flags,
    confidence: plan.confidence,
  };
}

export type BackfillApplyResult = {
  slug: string;
  status: "updated" | "skipped" | "error";
  message: string;
};

/** Build backfill update payload for one row (caller performs DB write). */
export function buildBackfillUpdate(
  row: PlaybookArticleRow,
  plan: BackfillPlan,
): Record<string, unknown> | null {
  if (!plan.wouldUpdate || !plan.articleSections) return null;

  const backupLegacy = row.article_legacy?.trim() ? row.article_legacy : row.article ?? "";

  return {
    article_legacy: backupLegacy,
    article_sections: plan.articleSections,
    article: plan.serializedArticle,
    faq: plan.faq,
    updated_at: new Date().toISOString(),
  };
}
