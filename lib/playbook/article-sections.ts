import {
  parsePlaybookArticleBlocks,
  type PlaybookArticleBlock,
} from "@/lib/playbook/article-format";
import { isHtmlContent } from "@/lib/playbook/is-html-content";
import { isHtmlEmpty, sanitizeArticleHtml } from "@/lib/playbook/sanitize-article-html";

export const ARTICLE_SECTIONS_VERSION = 1 as const;

export type ArticleSectionEntry = {
  id: string;
  title: string;
  body: string;
};

export type ArticleSections = {
  version: typeof ARTICLE_SECTIONS_VERSION;
  quickAnswer: string;
  introduction: string;
  sections: ArticleSectionEntry[];
  homeup: string;
  conclusion: string;
};

export type FaqEntry = { q: string; a: string };

export type ArticleSectionsValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function createSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyArticleSections(): ArticleSections {
  return {
    version: ARTICLE_SECTIONS_VERSION,
    quickAnswer: "",
    introduction: "",
    sections: [],
    homeup: "",
    conclusion: "",
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap plain text or markdown-ish content as sanitized HTML for section fields. */
export function plainTextToSectionHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isHtmlContent(trimmed)) return sanitizeArticleHtml(trimmed);

  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean);
  const html = paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return sanitizeArticleHtml(html);
}

function blocksToSections(blocks: PlaybookArticleBlock[]): ArticleSections {
  const sections: ArticleSectionEntry[] = [];
  const result = emptyArticleSections();

  for (const block of blocks) {
    switch (block.kind) {
      case "quick_answer":
        result.quickAnswer = plainTextToSectionHtml(block.body);
        break;
      case "introduction":
        result.introduction = plainTextToSectionHtml(block.body);
        break;
      case "section":
        sections.push({
          id: createSectionId(),
          title: block.title,
          body: plainTextToSectionHtml(block.body),
        });
        break;
      case "homeup":
        result.homeup = plainTextToSectionHtml(block.body);
        break;
      case "conclusion":
        result.conclusion = plainTextToSectionHtml(block.body);
        break;
      case "faq":
      case "content":
        break;
      default:
        break;
    }
  }

  result.sections = sections;
  return result;
}

/** Parse legacy article blob (markdown or HTML) into structured sections for the editor. */
export function parseLegacyArticleToSections(raw: string): ArticleSections {
  const text = raw?.trim() ?? "";
  if (!text) return emptyArticleSections();

  if (isHtmlContent(text)) {
    return parseHtmlArticleToSections(text);
  }

  const blocks = parsePlaybookArticleBlocks(text);
  return enrichParsedSections(blocksToSections(blocks), text);
}

const HTML_SECTION_LABELS = [
  "Quick Answer",
  "Introduction",
  "How HomeUp Approaches This",
  "Conclusion",
  "FAQ",
] as const;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
}

/** Pull ## Question? headings embedded inside an HTML section blob (common in WYSIWYG saves). */
export function splitEmbeddedQuestionSections(html: string): {
  lead: string;
  sections: ArticleSectionEntry[];
} {
  const text = html?.trim() ?? "";
  if (!text) return { lead: "", sections: [] };

  const splitRe =
    /(?:<p[^>]*>\s*)?(?:<strong>)?\s*##\s+([^<]+?\?)\s*(?:<\/strong>)?\s*(?:<\/p>)|<h2[^>]*>\s*([^<]+?\?)\s*<\/h2>/gi;

  type Part = { title: string; start: number; end: number };
  const parts: Part[] = [];
  let match: RegExpExecArray | null;

  while ((match = splitRe.exec(text)) !== null) {
    const title = stripTags(match[1] ?? match[2] ?? "").trim();
    if (!title.endsWith("?")) continue;
    parts.push({ title, start: match.index, end: match.index + match[0].length });
  }

  if (parts.length === 0) return { lead: text, sections: [] };

  const sections: ArticleSectionEntry[] = [];
  const lead = text.slice(0, parts[0]!.start).trim();

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const bodyStart = part.end;
    const bodyEnd = parts[i + 1]?.start ?? text.length;
    sections.push({
      id: createSectionId(),
      title: part.title,
      body: sanitizeArticleHtml(text.slice(bodyStart, bodyEnd).trim()),
    });
  }

  return { lead: sanitizeArticleHtml(lead), sections };
}

function inferConclusionFromHomeup(sections: ArticleSections): ArticleSections {
  if (!isHtmlEmpty(sections.conclusion) || isHtmlEmpty(sections.homeup)) return sections;

  const plain = htmlToPlainText(sections.homeup);
  const paragraphs = plain.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length < 3) return sections;

  return {
    ...sections,
    homeup: plainTextToSectionHtml(paragraphs.slice(0, -2).join("\n\n")),
    conclusion: plainTextToSectionHtml(paragraphs.slice(-2).join("\n\n")),
  };
}

function inferConclusionFromMarkdownTail(raw: string): string {
  const parts = raw.split(/\nFAQ:\s*\n/i);
  if (parts.length < 2) return "";
  const beforeFaq = parts[0] ?? "";
  const homeupSplit = beforeFaq.split(/\nHow HomeUp Approaches This:\s*\n/i);
  if (homeupSplit.length < 2) return "";

  const paragraphs = (homeupSplit[1] ?? "").trim().split(/\n\n+/).filter(Boolean);
  if (paragraphs.length < 3) return "";

  return paragraphs.slice(-2).join("\n\n").trim();
}

function enrichParsedSections(sections: ArticleSections, raw: string): ArticleSections {
  let result = { ...sections };

  if (!isHtmlEmpty(result.introduction)) {
    const { lead, sections: embedded } = splitEmbeddedQuestionSections(result.introduction);
    if (embedded.length > 0) {
      result = {
        ...result,
        introduction: lead,
        sections: [...result.sections, ...embedded],
      };
    }
  }

  result = inferConclusionFromHomeup(result);

  if (!isHtmlContent(raw) && isHtmlEmpty(result.conclusion)) {
    const inferred = inferConclusionFromMarkdownTail(raw);
    if (inferred) {
      result = { ...result, conclusion: plainTextToSectionHtml(inferred) };
    }
  }

  return result;
}

/** Best-effort extraction of sections from WYSIWYG HTML articles. */
function parseHtmlArticleToSections(html: string): ArticleSections {
  const result = emptyArticleSections();
  const sections: ArticleSectionEntry[] = [];

  const labelPattern = HTML_SECTION_LABELS.map((l) =>
    l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|");

  const splitRe = new RegExp(
    `(?:<p[^>]*>|<h[1-6][^>]*>)\\s*(?:<[^>]+>\\s*)*(${labelPattern}):?\\s*(?:<\\/[^>]+>\\s*)*(?:<\\/(?:p|h[1-6])>)`,
    "gi",
  );

  type Chunk = { label: string; html: string };
  const chunks: Chunk[] = [];
  let lastIndex = 0;
  let lastLabel = "";
  let match: RegExpExecArray | null;

  const fullHtml = html;
  while ((match = splitRe.exec(fullHtml)) !== null) {
    if (lastLabel) {
      chunks.push({
        label: lastLabel,
        html: fullHtml.slice(lastIndex, match.index).trim(),
      });
    }
    lastLabel = match[1].trim();
    lastIndex = match.index + match[0].length;
  }

  if (lastLabel) {
    chunks.push({ label: lastLabel, html: fullHtml.slice(lastIndex).trim() });
  }

  if (chunks.length === 0) {
    return { ...result, introduction: sanitizeArticleHtml(html) };
  }

  for (const chunk of chunks) {
    const label = chunk.label.toLowerCase();
    const body = sanitizeArticleHtml(chunk.html);

    if (label === "quick answer") result.quickAnswer = body;
    else if (label === "introduction") result.introduction = body;
    else if (label === "how homeup approaches this") result.homeup = body;
    else if (label === "conclusion") result.conclusion = body;
    else if (label === "faq") {
      // FAQ content belongs in faq column, not body sections
    }
  }

  // Extract h2 question sections from remaining HTML (between intro and homeup)
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
  let h2Match: RegExpExecArray | null;
  const bodyForH2 = html;
  while ((h2Match = h2Re.exec(bodyForH2)) !== null) {
    const title = stripTags(h2Match[1]);
    const body = sanitizeArticleHtml(h2Match[2]);
    if (!title || HTML_SECTION_LABELS.some((l) => l.toLowerCase() === title.toLowerCase())) {
      continue;
    }
    if (title.endsWith("?")) {
      sections.push({ id: createSectionId(), title, body });
    }
  }

  result.sections = sections;
  return enrichParsedSections(result, html);
}
export function normalizeArticleSections(input: ArticleSections): ArticleSections {
  return {
    version: ARTICLE_SECTIONS_VERSION,
    quickAnswer: sanitizeArticleHtml(input.quickAnswer),
    introduction: sanitizeArticleHtml(input.introduction),
    sections: (input.sections ?? [])
      .map((s) => ({
        id: s.id || createSectionId(),
        title: s.title.trim(),
        body: sanitizeArticleHtml(s.body),
      }))
      .filter((s) => s.title || !isHtmlEmpty(s.body)),
    homeup: sanitizeArticleHtml(input.homeup),
    conclusion: sanitizeArticleHtml(input.conclusion),
  };
}

export function isArticleSections(value: unknown): value is ArticleSections {
  if (!value || typeof value !== "object") return false;
  const v = value as ArticleSections;
  return (
    v.version === ARTICLE_SECTIONS_VERSION &&
    typeof v.quickAnswer === "string" &&
    typeof v.introduction === "string" &&
    Array.isArray(v.sections) &&
    typeof v.homeup === "string" &&
    typeof v.conclusion === "string"
  );
}

export function validateArticleSections(
  sections: ArticleSections,
  faq: FaqEntry[],
): ArticleSectionsValidationResult {
  const errors: string[] = [];

  if (isHtmlEmpty(sections.quickAnswer)) {
    errors.push("Quick Answer is required.");
  }
  if (isHtmlEmpty(sections.introduction)) {
    errors.push("Introduction is required.");
  }
  if (isHtmlEmpty(sections.homeup)) {
    errors.push("How HomeUp Approaches This is required.");
  }
  if (isHtmlEmpty(sections.conclusion)) {
    errors.push("Conclusion is required.");
  }

  const validFaq = faq.filter((f) => f.q.trim() && f.a.trim());
  if (validFaq.length === 0) {
    errors.push("Add at least one FAQ (question and answer).");
  }

  const filledSections = sections.sections.filter(
    (s) => s.title.trim() || !isHtmlEmpty(s.body),
  );
  if (filledSections.length === 0) {
    errors.push("Add at least one question section.");
  }

  for (const [i, section] of sections.sections.entries()) {
    if (!section.title.trim()) {
      errors.push(`Question section ${i + 1} needs a heading.`);
    }
    if (isHtmlEmpty(section.body)) {
      errors.push(`Question section ${i + 1} ("${section.title || "untitled"}") needs content.`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

/** Serialize structured sections to legacy markdown for backward-compatible article column. */
export function serializeArticleSectionsToMarkdown(sections: ArticleSections): string {
  const parts: string[] = [];

  if (!isHtmlEmpty(sections.quickAnswer)) {
    parts.push(`Quick Answer:\n\n${htmlToPlainText(sections.quickAnswer)}`);
  }
  if (!isHtmlEmpty(sections.introduction)) {
    parts.push(`Introduction:\n\n${htmlToPlainText(sections.introduction)}`);
  }

  for (const section of sections.sections) {
    if (!section.title.trim()) continue;
    parts.push(`${section.title}\n\n${htmlToPlainText(section.body)}`);
  }

  if (!isHtmlEmpty(sections.homeup)) {
    parts.push(`How HomeUp Approaches This:\n\n${htmlToPlainText(sections.homeup)}`);
  }
  if (!isHtmlEmpty(sections.conclusion)) {
    parts.push(`Conclusion:\n\n${htmlToPlainText(sections.conclusion)}`);
  }

  return parts.join("\n\n");
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Build ArticleSections from a pipeline draft (markdown with section labels). */
export function articleSectionsFromMarkdownArticle(article: string): ArticleSections {
  return normalizeArticleSections(
    enrichParsedSections(blocksToSections(parsePlaybookArticleBlocks(article)), article),
  );
}

/** Convert structured sections to PlaybookArticleBlock[] for the public renderer. */
export function articleSectionsToBlocks(sections: ArticleSections): PlaybookArticleBlock[] {
  const normalized = normalizeArticleSections(sections);
  const blocks: PlaybookArticleBlock[] = [];

  if (!isHtmlEmpty(normalized.quickAnswer)) {
    blocks.push({ kind: "quick_answer", body: normalized.quickAnswer });
  }
  if (!isHtmlEmpty(normalized.introduction)) {
    blocks.push({ kind: "introduction", body: normalized.introduction });
  }
  for (const section of normalized.sections) {
    if (section.title.trim()) {
      blocks.push({ kind: "section", title: section.title, body: section.body });
    }
  }
  if (!isHtmlEmpty(normalized.homeup)) {
    blocks.push({ kind: "homeup", body: normalized.homeup });
  }
  if (!isHtmlEmpty(normalized.conclusion)) {
    blocks.push({ kind: "conclusion", body: normalized.conclusion });
  }

  return blocks;
}

export function hasStructuredArticleContent(sections: ArticleSections | null | undefined): boolean {
  if (!sections) return false;
  return (
    !isHtmlEmpty(sections.quickAnswer) ||
    !isHtmlEmpty(sections.introduction) ||
    sections.sections.some((s) => s.title.trim() || !isHtmlEmpty(s.body)) ||
    !isHtmlEmpty(sections.homeup) ||
    !isHtmlEmpty(sections.conclusion)
  );
}
